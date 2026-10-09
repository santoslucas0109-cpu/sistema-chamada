// =====================================================
// MESP - SISTEMA DE FILA
// =====================================================


// =====================================================
// CONFIGURAÇÃO DO SUPABASE
// =====================================================

// COLOQUE AQUI OS DADOS DO SEU SUPABASE

const SUPABASE_URL =
    "COLE_AQUI_SUA_PROJECT_URL";

const SUPABASE_KEY =
    "COLE_AQUI_SUA_CHAVE_PUBLICA";


const banco = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// =====================================================
// DESCOBRIR QUAL TELA ESTÁ ABERTA
// =====================================================

const setor =
    document.body.dataset.setor;


const lista =
    document.getElementById("listaPacientes");

const contador =
    document.getElementById("contador");


// =====================================================
// SEGURANÇA DO TEXTO
// =====================================================

function escaparHTML(texto) {

    const div =
        document.createElement("div");

    div.textContent = texto;

    return div.innerHTML;
}


// =====================================================
// STATUS DA CONEXÃO
// =====================================================

function definirStatus(online) {

    const bolinha =
        document.getElementById("statusBolinha");

    const texto =
        document.getElementById("statusTexto");


    if (online) {

        bolinha.className =
            "status-bolinha online";

        texto.textContent =
            "Sistema online";

    } else {

        bolinha.className =
            "status-bolinha offline";

        texto.textContent =
            "Sem conexão";

    }

}


// =====================================================
// TESTAR CONEXÃO
// =====================================================

async function testarConexao() {

    const { error } =
        await banco
            .from("pacientes")
            .select("id")
            .limit(1);


    definirStatus(!error);


    if (error) {

        console.error(
            "Erro de conexão:",
            error
        );

    }

}


// =====================================================
// CARREGAR FILA
// =====================================================

async function carregarFila() {

    const { data, error } =
        await banco
            .from("pacientes")
            .select("*")
            .eq("status", setor)
            .order(
                "created_at",
                { ascending: true }
            );


    if (error) {

        console.error(error);

        definirStatus(false);

        lista.innerHTML = `

            <div class="vazio">

                <strong>
                    Erro ao carregar a fila
                </strong>

                Verifique a conexão com o sistema.

            </div>

        `;

        return;
    }


    definirStatus(true);

    contador.textContent =
        data.length;


    mostrarPacientes(data);

}


// =====================================================
// MOSTRAR PACIENTES
// =====================================================

function mostrarPacientes(pacientes) {

    if (pacientes.length === 0) {

        let mensagem =
            "Nenhum paciente aguardando.";


        if (setor === "recepcao") {

            mensagem =
                "Nenhum paciente aguardando na recepção.";

        }


        if (setor === "triagem") {

            mensagem =
                "Nenhum paciente aguardando a triagem.";

        }


        if (setor === "medico") {

            mensagem =
                "Nenhum paciente aguardando o médico.";

        }


        lista.innerHTML = `

            <div class="vazio">

                <strong>
                    Fila vazia
                </strong>

                ${mensagem}

            </div>

        `;

        return;
    }


    lista.innerHTML =
        pacientes
            .map(
                (paciente, indice) =>
                    criarCard(
                        paciente,
                        indice + 1
                    )
            )
            .join("");

}


// =====================================================
// CRIAR PACIENTE
// =====================================================

function criarCard(
    paciente,
    numero
) {

    const nomeSeguro =
        escaparHTML(paciente.nome);


    const horario =
        new Date(
            paciente.horario
        ).toLocaleTimeString(
            "pt-BR",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );


    let botoes = "";


    // RECEPÇÃO

    if (setor === "recepcao") {

        botoes = `

            <button
                class="btn btn-avancar"
                onclick="enviarTriagem(${paciente.id})"
            >
                Enviar para triagem →
            </button>


            <button
                class="btn btn-excluir"
                onclick="excluirPaciente(${paciente.id})"
            >
                Excluir
            </button>

        `;

    }


    // TRIAGEM

    if (setor === "triagem") {

        botoes = `

            <button
                class="btn btn-avancar"
                onclick="enviarMedico(${paciente.id})"
            >
                Enviar para médico →
            </button>

        `;

    }


    // MÉDICO

    if (setor === "medico") {

        botoes = `

            <button
                class="btn btn-finalizar"
                onclick="finalizarPaciente(${paciente.id})"
            >
                ✓ Finalizar atendimento
            </button>

        `;

    }


    return `

        <div class="paciente">

            <div class="paciente-info">

                <div class="numero">
                    ${numero}
                </div>


                <div>

                    <div class="nome">
                        ${nomeSeguro}
                    </div>

                    <div class="horario">
                        Chegada: ${horario}
                    </div>

                </div>

            </div>


            <div class="acoes">

                ${botoes}

            </div>

        </div>

    `;

}


// =====================================================
// CADASTRAR PACIENTE
// =====================================================

async function adicionarPaciente() {

    const campo =
        document.getElementById(
            "nomePaciente"
        );


    if (!campo) return;


    const nome =
        campo.value.trim();


    if (!nome) {

        alert(
            "Digite o nome do paciente."
        );

        campo.focus();

        return;
    }


    const botao =
        document.getElementById(
            "btnAdicionar"
        );


    botao.disabled = true;

    botao.textContent =
        "Adicionando...";


    const { error } =
        await banco
            .from("pacientes")
            .insert({

                nome: nome,

                status: "recepcao"

            });


    botao.disabled = false;

    botao.textContent =
        "+ Adicionar paciente";


    if (error) {

        console.error(error);

        alert(
            "Não foi possível adicionar o paciente."
        );

        return;
    }


    campo.value = "";

    campo.focus();


    carregarFila();

}


// =====================================================
// RECEPÇÃO -> TRIAGEM
// =====================================================

async function enviarTriagem(id) {

    const { error } =
        await banco
            .from("pacientes")
            .update({
                status: "triagem"
            })
            .eq("id", id);


    if (error) {

        alert(
            "Não foi possível enviar para a triagem."
        );

        console.error(error);

        return;
    }


    carregarFila();

}


// =====================================================
// TRIAGEM -> MÉDICO
// =====================================================

async function enviarMedico(id) {

    const { error } =
        await banco
            .from("pacientes")
            .update({
                status: "medico"
            })
            .eq("id", id);


    if (error) {

        alert(
            "Não foi possível enviar para o médico."
        );

        console.error(error);

        return;
    }


    carregarFila();

}


// =====================================================
// FINALIZAR
// =====================================================

async function finalizarPaciente(id) {

    const confirmar =
        confirm(
            "O atendimento deste paciente foi concluído?"
        );


    if (!confirmar) return;


    const { error } =
        await banco
            .from("pacientes")
            .delete()
            .eq("id", id);


    if (error) {

        alert(
            "Não foi possível finalizar."
        );

        console.error(error);

        return;
    }


    carregarFila();

}


// =====================================================
// EXCLUIR
// =====================================================

async function excluirPaciente(id) {

    const confirmar =
        confirm(
            "Deseja realmente remover este paciente?"
        );


    if (!confirmar) return;


    const { error } =
        await banco
            .from("pacientes")
            .delete()
            .eq("id", id);


    if (error) {

        alert(
            "Não foi possível excluir."
        );

        console.error(error);

        return;
    }


    carregarFila();

}


// =====================================================
// TEMPO REAL
// =====================================================

banco
    .channel("mesp-fila-tempo-real")

    .on(

        "postgres_changes",

        {

            event: "*",

            schema: "public",

            table: "pacientes"

        },

        () => {

            carregarFila();

        }

    )

    .subscribe();


// =====================================================
// ENTER
// =====================================================

const campoNome =
    document.getElementById(
        "nomePaciente"
    );


if (campoNome) {

    campoNome.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                adicionarPaciente();

            }

        }
    );

}


// =====================================================
// INICIAR
// =====================================================

testarConexao();

carregarFila();