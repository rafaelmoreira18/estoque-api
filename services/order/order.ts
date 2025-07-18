import prismaClient from '../../src/prisma'

interface OrderItemRequest {
    productId: string;
    amount: number;
}

interface OrderRequest {
    client: string;
    items: OrderItemRequest[];
}

interface UpdateOrderItemRequest {
    productId: string;
    amount: number; // Se amount = 0, remove o produto
}

interface UpdateOrderRequest {
    id: string;
    items: UpdateOrderItemRequest[];
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

// Atualizar Pedido
class UpdateOrderService {
    async execute({ id, items }: UpdateOrderRequest) {
        
        if (!id) {
            throw new Error("ID do pedido é obrigatório")
        }

        if (!items || items.length === 0) {
            throw new Error("Deve fornecer pelo menos um item para atualizar")
        }

        const existingOrder = await prismaClient.order.findUnique({
            where: { id },
            include: { items: true }
        })

        if (!existingOrder) {
            throw new Error("Pedido não encontrado")
        }

        // Processar cada item da requisição
        for (const updateItem of items) {
            const product = await prismaClient.product.findUnique({
                where: { id: updateItem.productId }
            })

            if (!product) {
                throw new Error(`Produto com ID ${updateItem.productId} não encontrado`)
            }

            const existingOrderItem = existingOrder.items.find(
                item => item.productId === updateItem.productId
            )

            // Se amount = 0, remover o produto
            if (updateItem.amount === 0) {
                if (existingOrderItem) {
                    // Restaurar estoque
                    await prismaClient.product.update({
                        where: { id: updateItem.productId },
                        data: {
                            stock: { increment: existingOrderItem.amount }
                        }
                    })

                    // Remover item do pedido
                    await prismaClient.orderItem.delete({
                        where: { id: existingOrderItem.id }
                    })
                }
                continue;
            }

            // Verificar estoque disponível
            let stockNeeded = updateItem.amount;
            if (existingOrderItem) {
                // Se já existe, calcular diferença
                stockNeeded = updateItem.amount - existingOrderItem.amount;
            }

            // Só verifica estoque se for necessário retirar mais do estoque
            if (stockNeeded > 0 && product.stock < stockNeeded) {
                throw new Error(`Estoque insuficiente para o produto ${product.name}. Disponível: ${product.stock}`)
            }

            if (existingOrderItem) {
                // Atualizar item existente
                await prismaClient.orderItem.update({
                    where: { id: existingOrderItem.id },
                    data: {
                        amount: updateItem.amount,
                        totalPrice: Number(product.price) * updateItem.amount
                    }
                })

                // Atualizar estoque (diferença)
                if (stockNeeded !== 0) {
                    if (stockNeeded > 0) {
                        // Precisa tirar do estoque
                        await prismaClient.product.update({
                            where: { id: updateItem.productId },
                            data: {
                                stock: { decrement: stockNeeded }
                            }
                        })
                    } else {
                        // Precisa devolver ao estoque
                        await prismaClient.product.update({
                            where: { id: updateItem.productId },
                            data: {
                                stock: { increment: Math.abs(stockNeeded) }
                            }
                        })
                    }
                }
            } else {
                // Adicionar novo item
                await prismaClient.orderItem.create({
                    data: {
                        orderId: id,
                        productId: updateItem.productId,
                        productName: product.name,
                        amount: updateItem.amount,
                        unitPrice: product.price,
                        totalPrice: Number(product.price) * updateItem.amount
                    }
                })

                // Reduzir estoque
                await prismaClient.product.update({
                    where: { id: updateItem.productId },
                    data: {
                        stock: { decrement: updateItem.amount }
                    }
                })
            }
        }

        // Recalcular total do pedido
        const updatedOrderItems = await prismaClient.orderItem.findMany({
            where: { orderId: id }
        })

        const newTotalPrice = updatedOrderItems.reduce((total, item) => {
            return total + Number(item.totalPrice)
        }, 0)

        // Atualizar total do pedido
        await prismaClient.order.update({
            where: { id },
            data: { totalPrice: newTotalPrice }
        })

        // Retornar pedido atualizado
        const updatedOrder = await prismaClient.order.findUnique({
            where: { id },
            include: { items: true }
        })

        return updatedOrder;
    }
}

export { 
    CreateOrderService, 
    ListOrdersService, 
    GetOrderByIdService, 
    DeleteOrderService,
    UpdateOrderService,
    UpdateOrderRequest
}