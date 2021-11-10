use anchor_lang::prelude::*; //modulos que serao usados

declare_id!("H7ZEaARWZkuFQSLdmbQ4EhxoayPaXfLMt9RgSJp1bQUd"); //id do programa

#[program]
pub mod myepicproject { //define que sera um modulo myepicproject contendo funções
  use super::*;
  pub fn start_stuff_off(ctx: Context<StartStuffOff>) -> ProgramResult { //funcao que recebe parametros context e retorna um programresult
    let base_account = &mut ctx.accounts.base_account; //pega uma referencia a account 
    //&mut pega uma referencia mutabel de base_account

    base_account.total_gifs = 0; //inicia o total de gifs
    Ok(()) //retorno padrao
  }

    //funcao que ira aceitar links externos de gifs
    pub fn add_gif(ctx: Context<AddGif>, gif_link: String) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;

        //Construindo a estrutura: Contem link do gif e o chave publica de quem enviou o link
        let item = ItemStruct {
            gif_link: gif_link.to_string(),
            user_address: *base_account.to_account_info().key,
        };

        //Adiciona isso a lista de gifs
        base_account.gif_list.push(item);
        base_account.total_gifs +=1;
        Ok(())
    }
}
#[derive(Accounts)] //define algumas restrições
pub struct StartStuffOff <'info>{
    #[account(init, payer = user, space = 9000)] //dizemos para solana como queremos inicializar BaseAccount
    //init diz para solana criar uma nova account para o programa atual
    //payer = user diz que quem esta pagando pela criação é o usuario que chamou a função
    //space 9000 define um espaço de 9000 bytes para esse programa.

    pub base_account: Account<'info, BaseAccount>, 
    #[account(mut)]
    pub user: Signer<'info>, //dado passado ao programa que o usuario  é dono da account do prograna
    pub system_program: Program <'info, System>,
}

#[derive(Accounts)]
pub struct AddGif<'info>{
    #[account(mut)]
    pub base_account: Account <'info, BaseAccount>,
}

//Cria uma estrutura customizada pra trabalharmos
//os dados serao armazenados serializados em bytes e para se possa ler serao desserializados
#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ItemStruct {
    pub gif_link: String,
    pub user_address: Pubkey,
}

//diz a solana o que queremos guardar dentro dessa account
#[account]
pub struct BaseAccount {
    pub total_gifs: u64,
    pub gif_list: Vec<ItemStruct>,
}