import { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo2.svg';
import myNFT from './assets/my-nft.png';
import './App.css';
import {Connection, PublicKey, clusterApiUrl} from "@solana/web3.js";
import {Program, Provider, web3} from "@project-serum/anchor";

import idl from "./idl.json";
import kp from './keypair.json'

// SystemProgram is a reference to the Solana runtime!
const {SystemProgram, Keypair} = web3;
// let baseAccount = Keypair.generate(); //cria um par de chaves para account que ira ser owner dos dados dos gifs

const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl('devnet');

// Controla o estado da transacao, processed é quando foi confirmada por 1 minerador e podemos "esperar" por mais confirmações
const opts ={
  preflightCommitment: "processed"
}

// Constants
const TWITTER_HANDLE = 'yanluizcripto';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const TEST_GIFS = [
  "https://c.tenor.com/lbEsggSJUOYAAAAd/solath-solana.gif",
  "https://c.tenor.com/2tH31QUw0-MAAAAM/solana-sol.gif",
  "https://c.tenor.com/LQRT4pTzVScAAAAM/solana-crypto.gif",
  "https://c.tenor.com/DZb2pDD9SjUAAAAM/solana-ccai-ethereum-eth-sol-gas-solanasummer.gif",
]

const App = () => {
  //Verifica se ha a extensao Phantom no browser.
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;
      if (solana) {
        if(solana.isPhantom){
          console.log("Phantom wallet encontrada!");
          // Verifica se o usuario ja deu permissao para o site alguma vez
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log("Conectada, endereço: ", response.publicKey.toString());
          setWalletAddress(response.pubicKey.toString());
        }
      } else {
        alert("Phantom wallet nao encontrada, por favos instale a extensão.")
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Botao Connect wallet se usuario nao tiver aprovado anteriormente.
  const connectWallet = async () => {
    const { solana } = window;
    if (solana) {
      const response = await solana.connect();
      console.log("Wallet conectada: ", response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const renderNotConnectedContainer = () => (
    <button 
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Conecte sua Carteira
    </button>
  );
  // END - Botao connect wallet

  // Input novos gifs
  const sendGif = async () => {
    if (inputValue.length ===0){
      console.log("Não foi passado nenhum link");
      return
    } 
    console.log("Gif link: ", inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
        },
      });
      console.log("Gif enviado para o programa", inputValue)

      await getGifList();
    } catch (error) {
      console.log("Erro ao enviar gif: ", error)
    }
  };

  const onInputChange = (event) => {
    const {value} = event.target;
    setInputValue(value);
  }
  // END - Input novos gifs

  //ira secomunicar com provider (rede) da phantom
  const getProvider =() => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }
  //END

  // Criando account para guardar dados dos gifs
  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();

    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }
  // END- Criando account para guardar dados dos gifs

  // Grid
  const renderConnectedContainer = () => {
  // so iremos mudar esse elemento em duas situações
  //1 - Usuario conectou wallet mas conta BaseAccount nao foi criada, gerar botao para que possa ser criado.
  //2 - Usuario conectou wallet e BaseAccount existe: renredizar lista de gifs e botao para enviar um novo. 

    if (gifList === null) {
    return (
      <div className="connected-container">
        <button className="cta-button submit-gif-button" onClick={createGifAccount}>
          Aprovar inicialização do Programa
        </button>
      </div>
    )
  } else {
    return (
    <div className="connected-container">
      {/* Caixa de texto para digitar link de outros gifs */}
      <input 
        type="text" 
        placeholder="Coloque aqui o link do seu gif!"
        value={inputValue}
        onChange={onInputChange}
      />
      <button className="cta-button submit-gif-button" onClick={sendGif}>
      Enviar
      </button>

      <div className="gif-grid">
        {gifList.map(gif => (
          <div className="gif-item" key={gif}>
            <img src={gif.gifLink} alt={gif} />
          </div>
        ))}
      </div>
    </div>
    )
  }

  };// END - Grid

  useEffect(() => {
    window.addEventListener("load", async (event) => {
      await checkIfWalletIsConnected();
    });
  }, []);

  // Pega a lista de gifs dentro da solana 
const getGifList = async() => {
  try{
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

    console.log("account encontrada", account)
    setGifList(account.gifList)
  } catch (error) {
    console.log("Error in GetGifs: ", error)
    setGifList(null);
  }
}

  useEffect(() => {
    if (walletAddress){
      console.log("Buscando lista de gifs...");

      // Chama o programa dentro da rede solana

      // setGifList(TEST_GIFS);
      getGifList();
    }
  }, [walletAddress]);

  // END - Verifica se ha a extensao Phantom no browser.

  //Interface
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <img alt="UALIEN #970" className="nft-logo" src=
          {myNFT} />
          <p className="header"> Meu 1º App na Solana</p>
          <p className="sub-text">
            Biblioteca de GIFs ✨
          </p>
          {/* Se a wallet nao estiver conectada aparece o botao */}
          {!walletAddress && renderNotConnectedContainer()}

          {/* Ira mostrar somente se a wallet estiver conectada */}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`feito por @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
  // END - Interface
};

export default App;
