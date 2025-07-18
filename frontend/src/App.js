import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:3333";

function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/products`).then((res) => setProducts(res.data));
    axios.get(`${API_URL}/orders`).then((res) => setOrders(res.data));
  }, []);

  return (
    <div className="main-bg">
      <div className="container">
        <header>
          <h1>📦 Estoque & Pedidos</h1>
          <p className="subtitle">Visualização dos produtos e pedidos cadastrados</p>
        </header>
        <div className="grid">
          <section>
            <h2>Produtos</h2>
            {products.length === 0 ? (
              <div className="empty">Nenhum produto cadastrado.</div>
            ) : (
              <div className="cards">
                {products.map((prod) => (
                  <div className="card product-card" key={prod.id}>
                    <div className="card-title">{prod.name}</div>
                    <div className="card-desc">{prod.description}</div>
                    <div className="card-info">
                      <span>Preço: <b>R$ {parseFloat(prod.price).toFixed(2)}</b></span>
                      <span>Estoque: <b>{prod.stock}</b></span>
                    </div>
                    <div className="order-id">ID: {prod.id}</div>
                  </div>
                ))}
              </div>
            )}
           

          </section>
          <section>
            <h2>Pedidos</h2>
            {orders.length === 0 ? (
              <div className="empty">Nenhum pedido cadastrado.</div>
            ) : (
              <div className="cards">
                {orders.map((order) => (
                  <div className="card order-card" key={order.id}>
                    <div className="card-title" >Cliente: {order.client}</div>
                    <div className="card-info">
                      <span>
                        <b>Itens:</b>
                        <div className="card order-card" key={order.id}>
  <div className="card-title">Cliente: {order.client}</div>
  <div className="card-info">
    <span>
      <b>Itens:</b>
      <ul className="order-items">
        {order.items &&
          order.items.map((item) => (
            <li key={item.id}>
              {item.productName} <span className="amount">({item.amount}x)</span>
              <span className="unit-price">
                — R$ {parseFloat(item.unitPrice).toFixed(2)} cada
              </span>
            </li>
          ))}
      </ul>
    <br></br>
 <div className="order-id">ID: {order.id}</div>

    </span>
  </div>
</div>
                      </span>
                    </div>
                    <div className="order-total">
                      Total: <b>R$ {parseFloat(order.totalPrice).toFixed(2)}</b>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        <footer>
          <span>
            <a href="https://github.com/" target="_blank" rel="noopener noreferrer">
              <b>Visualização de Estoque</b>
            </a>{" "}
            &copy; {new Date().getFullYear()}
          </span>
        </footer>
      </div>
    </div>
  );
}

export default App;