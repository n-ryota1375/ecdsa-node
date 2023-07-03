import { useState } from "react";
import server from "./server";

import * as secp from "ethereum-cryptography/secp256k1";
import { toHex, utf8ToBytes, hexToBytes } from "ethereum-cryptography/utils";
import { keccak256 } from "ethereum-cryptography/keccak";

function Transfer({ privateKey, address, setBalance }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  

  function setValue(setter) {
    return (evt) => setter(evt.target.value);
  }

  async function transfer(evt) {
    evt.preventDefault();

    const msg = `${address} + ${sendAmount} + ${recipient} `;
    //console.log(msg);

    const msgHash = toHex(keccak256(utf8ToBytes(msg)));
    console.log(msgHash);

    // Convert the hexadecimal representation of the private key received from the user to binary
    const privateKeyBinary = hexToBytes(privateKey);

    const signature = secp.secp256k1.sign(msgHash, privateKeyBinary);
    //console.log(signature);
    //console.log(signature instanceof secp.secp256k1.Signature);

    // signature serialized because signature instance can't send the server
    const signatureSerialized = {
      r: signature.r.toString(),
      s: signature.s.toString(),
      recovery: signature.recovery,
    }
    //console.log(signatureSerialized);

    try {
      const {
        data: { balance },
      } = await server.post(`send`, {
          signature: signatureSerialized,
          msgHash,
          sender: address,
          recipient,
          amount: parseInt(sendAmount)
        });
      setBalance(balance);
    } catch (ex) {
      alert(ex.response.data.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
