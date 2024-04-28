import express from "express";
const app = express();
import { promises as fs } from "fs";
const { readFile, writeFile } = fs;
app.use(express.json());

const port = 3000;

const path =
  "C:/Users/cleis/OneDrive/Área de Trabalho/delivery-api/src/data/pedidos.json";

// rotas ------------------

app.post("/create", async (req, res) => {
  try {
    let pedido = req.body;
    const data = JSON.parse(await readFile(path));
    const dataAtual = new Date();
    pedido = {
      id: data.nextId++,
      ...pedido,
      entregue: false,
      timestamp: dataAtual,
    };
    data.pedidos.push(pedido);
    await writeFile(path, JSON.stringify(data));
    res.send(pedido);
  } catch (err) {
    res.status(400).send({ error: "Failed to load Json" });
    return console.log(err);
  }
  res.end();
});

//-------------------------------------

app.put("/update", async (req, res) => {
  try {
    let pedido = req.body;
    const data = JSON.parse(await readFile(path));
    const index = data.pedidos.findIndex((a) => a.id === pedido.id);

    if (index !== -1 && index < data.pedidos.length) {
      // O índice é válido, então podemos atualizar o pedido
      data.pedidos[index] = pedido;
      await writeFile(path, JSON.stringify(data));

      res.send(pedido);
    } else {
      // Índice inválido
      res.status(404).send({ error: "Pedido não encontrado" });
    }
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

app.put("/atualizar-pedido/:id", async (req, res) => {
  try {
    const pedidoId = req.params.id; // Obtém o ID do pedido dos parâmetros da URL
    const { cliente, produto, valor, entregue } = req.body; // Obtém os novos dados do pedido do corpo da requisição

    // Ler os dados do arquivo pedidos.json
    const data = JSON.parse(await readFile(path));

    // Verificar se o pedido com o ID fornecido existe
    const pedidoExistenteIndex = data.pedidos.findIndex(
      (pedido) => pedido.id === parseInt(pedidoId)
    );

    if (pedidoExistenteIndex === -1) {
      // Se o pedido não existe, retornar um erro
      return res.status(404).send({ error: "Pedido não encontrado" });
    }

    // Atualizar as informações do pedido com os novos dados
    data.pedidos[pedidoExistenteIndex].cliente = cliente;
    data.pedidos[pedidoExistenteIndex].produto = produto;
    data.pedidos[pedidoExistenteIndex].valor = valor;
    data.pedidos[pedidoExistenteIndex].entregue = entregue;

    // Escrever os novos dados no arquivo pedidos.json
    await writeFile(path, JSON.stringify(data, null, 2));

    res.send({ message: "Pedido atualizado com sucesso" });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

// altera o status da entrega do pedido

app.patch("/update/:id", async (req, res) => {
  try {
    const pedidoId = req.params.id; // Obtém o ID do pedido dos parâmetros da URL
    const { entregue } = req.body; // Obtém o novo valor do campo "entregue" do corpo da requisição

    const data = JSON.parse(await readFile(path));
    const index = data.pedidos.findIndex(
      (pedido) => pedido.id === parseInt(pedidoId)
    );

    if (index !== -1 && index < data.pedidos.length) {
      // O índice é válido, então podemos atualizar o campo "entregue" do pedido
      data.pedidos[index].entregue = entregue;
      await writeFile(path, JSON.stringify(data, null, 2));

      res.send({
        message: "Status de entrega do pedido atualizado com sucesso",
      });
    } else {
      // Índice inválido, enviar uma resposta de erro
      res.status(404).send({ error: "Pedido não encontrado" });
    }
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

// retorna um pedido baseado no ID
app.get("/pedido/:id", async (req, res) => {
  try {
    const data = JSON.parse(await readFile(path));
    const pedido = data.pedidos.find(
      (pedido) => pedido.id === parseInt(req.params.id)
    );
    res.send(pedido);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

// retorna o valor total de pedidos pelo nome do cliente
app.get("/totalpedidos/:cliente", async (req, res) => {
  try {
    const cliente = req.params.cliente; // Obtém o nome do cliente dos parâmetros da URL

    const data = JSON.parse(await readFile(path));
    const totalPedidos = data.pedidos.reduce((total, pedido) => {
      // Verifica se o pedido pertence ao cliente fornecido e se foi entregue
      if (pedido.cliente === cliente && pedido.entregue) {
        total += pedido.valor; // Adiciona o valor do pedido ao total
      }
      return total;
    }, 0);

    res.send({ totalPedidos });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

// deleta um pedido pelo ID
app.delete("/delete/:id", async (req, res) => {
  try {
    const data = JSON.parse(await readFile(path));
    data.pedidos = data.pedidos.filter(
      (pedido) => pedido.id !== parseInt(req.params.id)
    );

    await writeFile(path, JSON.stringify(data, null, 2));
    res.send("Pedido excluido com sucesso!");
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

//

app.get("/totalpedidosproduto/:produto", async (req, res) => {
  try {
    const produto = req.params.produto; // Obtém o nome do produto dos parâmetros da URL

    const data = JSON.parse(await readFile(path));
    const totalPedidosProduto = data.pedidos.reduce((total, pedido) => {
      // Verifica se o pedido é do produto fornecido e se foi entregue
      if (pedido.produto === produto && pedido.entregue) {
        total += pedido.valor; // Adiciona o valor do pedido ao total
      }
      return total;
    }, 0);

    res.send({ produto, totalPedidosProduto });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

// mais vedidos e entregues

app.get("/maisvendidos", async (_req, res) => {
  try {
    const data = JSON.parse(await readFile(path));

    // Objeto para armazenar a contagem de pedidos para cada produto
    const produtosContagem = {};

    // Itera sobre os pedidos para contar a quantidade de vezes que cada produto foi pedido
    data.pedidos.forEach((pedido) => {
      if (pedido.entregue) {
        // Considera apenas os pedidos já entregues
        const produto = pedido.produto;
        if (produtosContagem[produto]) {
          produtosContagem[produto]++;
        } else {
          produtosContagem[produto] = 1;
        }
      }
    });

    // Converte o objeto de contagem em um array de objetos para facilitar a classificação
    const produtosArray = Object.keys(produtosContagem).map((produto) => ({
      produto,
      quantidade: produtosContagem[produto],
    }));

    // Ordena os produtos com base na quantidade de pedidos em ordem decrescente
    produtosArray.sort((a, b) => b.quantidade - a.quantidade);

    res.send(produtosArray);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

//------------------------------------- roda o server
app.listen(port, async () => {
  try {
    await readFile(path);
    console.log("API Started!");
  } catch (err) {
    const initialJson = {
      nextId: 1,
      pedidos: [],
    };

    writeFile(path, JSON.stringify(initialJson))
      .then(() => {
        console.log("API Started and File Created!");
      })
      .catch((err) => {
        console.log(err);
      });
  }
});
