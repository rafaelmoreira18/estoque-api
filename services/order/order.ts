import prismaClient from '../../src/prisma'

interface OrderItemRequest {
    productId: string;
    amount: number;
}

interface OrderRequest {
    client: string;
    items: OrderItemRequest[];
}

interface UpdateOrderRequest {
    id: string;
    client?: string;
    items?: OrderItemRequest[];
}

// Criar Pedido
class CreateOrderService {
    async execute({ client, items }: OrderRequest) {
        
        if (!client) {
            throw new Error("Nome do cliente é obrigatório")
        }

        if (!items || items.length === 0) {
            throw new Error("Pedido deve ter pelo menos um item")
        }

        let totalPrice = 0;

        // Validar produtos e calcular total
        for (const item of items) {
            const product = await prismaClient.product.findUnique({
                where: { id: item.productId }
            })

            if (!product) {
                throw new Error(`Produto com ID ${item.productId} não encontrado`)
            }

            if (product.stock < item.amount) {
                throw new Error(`Estoque insuficiente para o produto ${product.name}`)
            }

            totalPrice += Number(product.price) * item.amount;
        }

        // Criar o pedido
        const order = await prismaClient.order.create({
            data: {
                client,
                totalPrice
            }
        })

        // Criar os itens do pedido e atualizar estoque
        for (const item of items) {
            const product = await prismaClient.product.findUnique({
                where: { id: item.productId }
            })

            await prismaClient.orderItem.create({
                data: {
                    orderId: order.id,
                    productId: item.productId,
                    productName: product!.name,
                    amount: item.amount,
                    unitPrice: product!.price,
                    totalPrice: Number(product!.price) * item.amount
                }
            })

            // Atualizar estoque
            await prismaClient.product.update({
                where: { id: item.productId },
                data: {
                    stock: product!.stock - item.amount
                }
            })
        }

        // Retornar pedido completo
        const completeOrder = await prismaClient.order.findUnique({
            where: { id: order.id },
            include: {
                items: true
            }
        })

        return completeOrder;
    }
}

// Listar Pedidos
class ListOrdersService {
    async execute() {
        const orders = await prismaClient.order.findMany({
            include: {
                items: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return orders;
    }
}

// Obter Pedido por ID
class GetOrderByIdService {
    async execute(id: string) {
        
        if (!id) {
            throw new Error("ID do pedido é obrigatório")
        }

        const order = await prismaClient.order.findUnique({
            where: { id },
            include: {
                items: true
            }
        })

        if (!order) {
            throw new Error("Pedido não encontrado")
        }

        return order;
    }
}

// Excluir Pedido
class DeleteOrderService {
    async execute(id: string) {
        
        if (!id) {
            throw new Error("ID do pedido é obrigatório")
        }

        const orderExists = await prismaClient.order.findUnique({
            where: { id },
            include: { items: true }
        })

        if (!orderExists) {
            throw new Error("Pedido não encontrado")
        }

        // Restaurar estoque dos produtos
        for (const item of orderExists.items) {
            await prismaClient.product.update({
                where: { id: item.productId },
                data: {
                    stock: {
                        increment: item.amount
                    }
                }
            })
        }

        // Deletar itens do pedido primeiro (por causa da FK)
        await prismaClient.orderItem.deleteMany({
            where: { orderId: id }
        })

        // Deletar o pedido
        await prismaClient.order.delete({
            where: { id }
        })

        return { message: "Pedido removido com sucesso" };
    }
}

export { 
    CreateOrderService, 
    ListOrdersService, 
    GetOrderByIdService, 
    DeleteOrderService 
}