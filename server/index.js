const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

const secp = require("ethereum-cryptography/secp256k1");
const { toHex, hexToBytes } = require("ethereum-cryptography/utils");
const { keccak256 } = require("ethereum-cryptography/keccak");


app.use(cors());
app.use(express.json());

const balances = {
  "ebe1bfbd360615206bbe365f893a25bc79d1c0bc": 100,
  "3ea5bdc9909c08a0f7d2902001721ab6d861cb28": 50,
  "b9e2ca4562ca26944592e27d06143503b838cb13": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { sender, recipient, amount, signature: signatureSerialized, msgHash} = req.body;

  // Convert msgHash to Uint8Array
  //const msgHashUint8 = Uint8Array.from(Object.values(msgHash));
  //console.log(msgHashUint8);

  console.log(msgHash);

  // Create a new Signature instance from the serialized signature
  const { r, s , recovery } = signatureSerialized;
  const signatureInstance = new secp.secp256k1.Signature(BigInt(r), BigInt(s), recovery);
  //console.log(signatureInstance); //ここまでは同じ値

  // Recover the public key from the signature
  const recoverPublicKey = signatureInstance.recoverPublicKey(msgHash);
  console.log(recoverPublicKey);
 
  // Compress the public key
  const publicKey = recoverPublicKey.toHex(true);

  console.log("public key:" + publicKey);

 
  const address = toHex(keccak256(hexToBytes(publicKey.slice(2))).slice(-20));
  //console.log("address:" + address);

  // Check if the recover address matches the sender's address
  if (address !== sender) {
    res.status(400).send({ message: "Invalid signature!" });
    return;
  }

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
