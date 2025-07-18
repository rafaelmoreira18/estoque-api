import prismaClient from '../../src/prisma'

interface ProductRequest {
    name: string;
    description?: string;
    price: number;
    stock: number;
}

interface UpdateProductRequest {
    id: string;
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
}

// Criar Produto
class CreateProductService {
    async execute({ name, description, price, stock }: ProductRequest) {
        console.log('Recebido:', { name, description, price, stock });
        if (!name) {
            throw new Error("Nome do produto é obrigatório")
        }

        if (!price || price <= 0) {
            throw new Error("Preço deve ser maior que zero")
        }

        if (stock <= 0 || !stock) {
            throw new Error("Estoque não pode ser 0")
        }

        const product = await prismaClient.product.create({
            data: {
                name,
                description,
                price,
                stock
            }
        })
        console.log("produto foi criado!");
        return product;
    }
}

// Listar Produtos
class ListProductsService {
    async execute() {
        const products = await prismaClient.product.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        })

        return products;
    }
}

// Obter Produto por ID
class GetProductByIdService {
    async execute(id: string) {
        
        if (!id) {
            throw new Error("ID do produto é obrigatório")
        }

        const product = await prismaClient.product.findUnique({
            where: {
                id: id
            }
        })

        if (!product) {
            throw new Error("Produto não encontrado")
        }

        return product;
    }
}

// Atualizar Produto
class UpdateProductService {
    async execute({ id, name, description, price, stock }: UpdateProductRequest) {
        
        if (!id) {
            throw new Error("ID do produto é obrigatório")
        }

        // Verificar se o produto existe
        const productExists = await prismaClient.product.findUnique({
            where: { id }
        })

        if (!productExists) {
            throw new Error("Produto não encontrado")
        }

        if (price && price <= 0) {
            throw new Error("Preço deve ser maior que zero")
        }

        if (stock && stock < 0) {
            throw new Error("Estoque não pode ser negativo")
        }

        const product = await prismaClient.product.update({
            where: { id },
            data: {
                name,
                description,
                price,
                stock
            }
        })

        return product;
    }
}

// Excluir Produto
class DeleteProductService {
    async execute(id: string) {
        
        if (!id) {
            throw new Error("ID do produto é obrigatório")
        }

        // Verificar se o produto existe
        const productExists = await prismaClient.product.findUnique({
            where: { id }
        })

        if (!productExists) {
            throw new Error("Produto não encontrado")
        }

        await prismaClient.product.delete({
            where: { id }
        })

        return { message: "Produto removido com sucesso" };
    }
}

export { 
    CreateProductService, 
    ListProductsService, 
    GetProductByIdService, 
    UpdateProductService, 
    DeleteProductService 
}