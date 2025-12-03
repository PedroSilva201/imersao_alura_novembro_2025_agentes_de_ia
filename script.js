let cardContainer = document.querySelector(".card-container");
let campoBusca = document.querySelector("header input");
let dados = [];

// Adiciona um listener para buscar automaticamente ao digitar
campoBusca.addEventListener('input', iniciarBusca);

// --- FUNÇÃO AUXILIAR PARA FUZZY SEARCH (DISTÂNCIA DE LEVENSHTEIN) ---

/**
 * Calcula a Distância de Levenshtein entre duas strings.
 * Fonte: Adaptado de https://pt.wikipedia.org/wiki/Dist%C3%A2ncia_de_Levenshtein
 */
function levenshteinDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    // Cria matriz de distâncias
    const d = Array(s1.length + 1).fill(null).map(() => Array(s2.length + 1).fill(null));

    // Inicializa a primeira linha e coluna
    for (let i = 0; i <= s1.length; i += 1) {
        d[i][0] = i;
    }
    for (let j = 0; j <= s2.length; j += 1) {
        d[0][j] = j;
    }

    // Preenche a matriz
    for (let j = 1; j <= s2.length; j += 1) {
        for (let i = 1; i <= s1.length; i += 1) {
            const cost = (s1[i - 1] === s2[j - 1]) ? 0 : 1;
            d[i][j] = Math.min(
                d[i - 1][j] + 1,      // Exclusão
                d[i][j - 1] + 1,      // Inserção
                d[i - 1][j - 1] + cost  // Substituição
            );
        }
    }

    return d[s1.length][s2.length];
}

// ----------------------------------------------------------------------

async function iniciarBusca() {
    // Se os dados ainda não foram carregados, busca do JSON.
    if (dados.length === 0) {
        try {
            let resposta = await fetch("data.json");
            dados = await resposta.json();
        } catch (error) {
            console.error("Falha ao buscar dados:", error);
            return;
        }
    }

    const termoBusca = campoBusca.value.toLowerCase().trim();
    
    // Se o campo de busca estiver vazio, retorna todos os dados.
    if (!termoBusca) {
        renderizarCards(dados);
        return;
    }

    // Define a tolerância máxima a erros. 
    // Por exemplo: 1 erro para termos de até 5 caracteres, 2 erros para mais.
    const maxErros = termoBusca.length <= 5 ? 1 : 2;

    const dadosFiltrados = dados.filter(dado => {
        // 1. Prioriza a busca exata (se o termo estiver contido no nome/descrição)
        const buscaExata = 
            dado.nome.toLowerCase().includes(termoBusca) || 
            dado.descricao.toLowerCase().includes(termoBusca);
        
        if (buscaExata) return true;

        // 2. Tenta a busca com tolerância (fuzzy) no nome.
        const distanciaNome = levenshteinDistance(dado.nome, termoBusca);
        const buscaFuzzyNome = distanciaNome <= maxErros;

        if (buscaFuzzyNome) return true;

        // 3. (Opcional) Poderíamos aplicar a busca fuzzy na descrição,
        // mas isso é caro em termos de performance, então focaremos apenas no NOME.

        return false;
    });

    renderizarCards(dadosFiltrados);
}

function renderizarCards(dados) {
    cardContainer.innerHTML = ""; // Limpa os cards existentes antes de renderizar novos
    
    if (dados.length === 0) {
        cardContainer.innerHTML = '<p class="aviso-sem-dados">Nenhum resultado encontrado. Tente outro termo de busca.</p>';
        // Adiciona um estilo básico para a mensagem de aviso (melhoria visual)
        if (document.querySelector('.aviso-sem-dados')) {
            document.querySelector('.aviso-sem-dados').style.textAlign = 'center';
            document.querySelector('.aviso-sem-dados').style.marginTop = '2rem';
        }
        return;
    }
    
    for (let dado of dados) {
        let article = document.createElement("article");
        article.classList.add("card");
        
        article.innerHTML = `
        <h2>${dado.nome}</h2>
        <p>${dado.data_criacao}</p>
        <p>${dado.descricao}</p>
        <a href="${dado.link_oficial}" target="_blank">Saiba mais</a>
        `
        cardContainer.appendChild(article);
    }
}

// 🚀 Executa a função assim que o script é carregado para mostrar todos os cards inicialmente.
iniciarBusca();

// Adiciona o listener para o botão de busca (garantia e usabilidade)
document.getElementById("botao-busca").onclick = iniciarBusca;