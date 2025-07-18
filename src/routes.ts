import { Router, Request, Response } from 'express';
import { 
    CreateProductService, 
    ListProductsService, 
    GetProductByIdService, 
    UpdateProductService, 
    DeleteProductService,
    
} from '../services/product/product';

import { 
    CreateOrderService, 
    ListOrdersService, 
    GetOrderByIdService, 
    DeleteOrderService,
    UpdateOrderService
} from '../services/order/order';

const router = Router();

router.get('/ping', (req, res) => {
  console.log('Ping recebido!');
  res.json({ message: 'pong' });
});

// ===== ROTAS DE PRODUTOS =====

// Criar produto
router.post('/products', async (req: Request, res: Response) => {
    const service = new CreateProductService();
    const product = await service.execute(req.body);
    return res.json(product);
});
// Listar produtos
router.get('/products', async (req: Request, res: Response) => {
    const service = new ListProductsService();
    const products = await service.execute();
    return res.json(products);
});

// Obter produto por ID
router.get('/products/:id', async (req: Request, res: Response) => {
    const service = new GetProductByIdService();
    const product = await service.execute(req.params.id);
    return res.json(product);
});

// Atualizar produto
router.put('/products/:id', async (req: Request, res: Response) => {
    const service = new UpdateProductService();
    const product = await service.execute({
        id: req.params.id,
        ...req.body
    });
    return res.json(product);
});

// Excluir produto
router.delete('/products/:id', async (req: Request, res: Response) => {
    const service = new DeleteProductService();
    const result = await service.execute(req.params.id);
    return res.json(result);
});

// ===== ROTAS DE PEDIDOS =====

// Criar pedido
router.post('/orders', async (req: Request, res: Response) => {
    const service = new CreateOrderService();
    const order = await service.execute(req.body);
    return res.json(order);
});

// Listar pedidos
router.get('/orders', async (req: Request, res: Response) => {
    const service = new ListOrdersService();
    const orders = await service.execute();
    return res.json(orders);
});

// Obter pedido por ID
router.get('/orders/:id', async (req: Request, res: Response) => {
    const service = new GetOrderByIdService();
    const order = await service.execute(req.params.id);
    return res.json(order);
});

// Atualizar pedido
router.put('/orders/:id', async (req: Request, res: Response) => {
    try {
        const service = new UpdateOrderService();
        const { items } = req.body;
        const { id } = req.params;
        const order = await service.execute({ id, items });
        return res.json(order);
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
});

// Excluir pedido
router.delete('/orders/:id', async (req: Request, res: Response) => {
    const service = new DeleteOrderService();
    const result = await service.execute(req.params.id);
    return res.json(result);
});

// ===== ROTA DE TESTE =====
router.get('/teste', (req: Request, res: Response) => {
        return res.json("name");
});

export { router };