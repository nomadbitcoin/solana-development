const anchor = require('@project-serum/anchor');

const {SystemProgram} = anchor.web3;

const main = async() => {
  console.log("Começando teste...")

  const provider = anchor.Provider.env(); //seta nosso provedor local configurado em "solana config get"
  anchor.setProvider(provider);

  const program = anchor.workspace.Myepicproject; //faz deploy do contrato em lib.rs na rede local
  
  const baseAccount = anchor.web3.Keypair.generate(); //cria o par de chaves que o programa ira usar

  let tx = await program.rpc.startStuffOff({ //chamamos a função que esta dentro do programa e aguardamos ser "minerada"
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [baseAccount],
  });

  console.log("Sua assinatura de transação: ", tx);

  let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log("GIF Count: ", account.totalGifs.toString())

  //agora precisamos passar links para funcao que recebe links
  await program.rpc.addGif("cole_o_link_do_gif_aqui", {
    accounts: {
      baseAccount: baseAccount.publicKey,
    },
  });

  //chama a conta
  account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log("Contagem de GIFs", account.totalGifs.toString())

  //acessando a lista de gifs guardados na account do programa
  console.log("GIF List: ", account.gifList)
}

const runMain = async () => {
  try{
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();