const API = "https://olho-alerta.onrender.com";

document.addEventListener("DOMContentLoaded", () => {

  /* --------------------------------------------------------
     TOAST
  -------------------------------------------------------- */
  function mostrarToast(mensagem, tipo = "sucesso") {
    let toast = document.getElementById("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = mensagem;
    toast.className = `show ${tipo}`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.className = toast.className.replace("show", "").trim();
    }, 3500);
  }

  /* --------------------------------------------------------
     NAVEGAÇÃO (SPA)
  -------------------------------------------------------- */
  const navLinks   = document.getElementById("navLinks");
  const menuToggle = document.getElementById("menuToggle");

  function mostrarPagina(id) {
    document.querySelectorAll(".pagina").forEach(p => p.classList.remove("ativa"));
    const alvo = document.getElementById(id);
    if (alvo) alvo.classList.add("ativa");

    history.pushState({ pagina: id }, "", "#" + id);
    navLinks.classList.remove("active");
    window.scrollTo(0, 0);

    document.querySelectorAll(".nav-links a").forEach(a => {
      a.classList.toggle("ativo", a.dataset.pagina === id);
    });

    if (id === "acompanhar-denuncia") {
      setTimeout(iniciarMapa, 100);
    }
  }

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-pagina]");
    if (el) {
      e.preventDefault();
      mostrarPagina(el.dataset.pagina);
    }
  });

  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });

  document.addEventListener("click", (e) => {
    if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
      navLinks.classList.remove("active");
    }
  });

  window.addEventListener("popstate", () => {
    const pagina = location.hash.replace("#", "") || "inicio";
    mostrarPagina(pagina);
  });

  mostrarPagina(location.hash.replace("#", "") || "inicio");

  /* --------------------------------------------------------
     BUSCA RÁPIDA
  -------------------------------------------------------- */
  const campoBusca = document.getElementById("campoBusca");
  document.querySelectorAll(".categorias [data-busca]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (campoBusca) campoBusca.value = btn.dataset.busca;
    });
  });

  /* --------------------------------------------------------
     IDENTIFICAÇÃO CONDICIONAL
  -------------------------------------------------------- */
  const selectIdent = document.getElementById("identificacao");
  const boxIdent    = document.getElementById("dadosIdentificacao");
  if (selectIdent && boxIdent) {
    selectIdent.addEventListener("change", () => {
      boxIdent.classList.toggle("hidden", selectIdent.value !== "identificado");
    });
  }

  /* --------------------------------------------------------
     ENVIO DE FORMULÁRIOS
  -------------------------------------------------------- */
  function enviarFormulario(formId, campos, nomeForm) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const dados = {};
      campos.forEach(campo => {
        const el = form.querySelector(`[name="${campo}"]`);
        if (el) dados[campo] = el.value.trim();
      });

      const botao = form.querySelector("button[type='submit']");
      const textoOriginal = botao.textContent;
      botao.textContent = "Enviando…";
      botao.disabled = true;

      try {
        const res = await fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dados),
        });

        if (res.ok) {
          const dados = await res.json().catch(() => ({}));
          const protocolo = dados.id ? ` | Protocolo: #${dados.id}` : "";
          mostrarToast(`✅ ${nomeForm} enviada com sucesso!${protocolo}`, "sucesso");
          form.reset();
          if (boxIdent) boxIdent.classList.add("hidden");
        } else {
          const erro = await res.json().catch(() => ({}));
          mostrarToast(`❌ Erro ao enviar ${nomeForm.toLowerCase()}. ${erro.error || ""}`, "erro");
        }
      } catch (err) {
        mostrarToast("❌ Não foi possível conectar ao servidor.", "erro");
        console.error(`[${nomeForm}]`, err);
      } finally {
        botao.textContent = textoOriginal;
        botao.disabled = false;
      }
    });
  }

  enviarFormulario("formDenuncia", [
    "tipo", "descricao", "endereco", "data",
    "identificacao", "nome", "email", "telefone"
  ], "Denúncia");

  enviarFormulario("formFeedback", [
    "nome", "email", "tipo", "descricao"
  ], "Feedback");

  enviarFormulario("formContato", [
    "nomeContato", "emailContato", "telefoneContato", "mensagemContato"
  ], "Mensagem");

  enviarFormulario("formAcesso", [
    "nome", "email", "orgao", "tipo", "descricao", "formato", "finalidade"
  ], "Pedido de Acesso");

  /* --------------------------------------------------------
     CONSULTA DE PROTOCOLO
  -------------------------------------------------------- */
  const formConsulta = document.getElementById("formConsulta");
  if (formConsulta) {
    formConsulta.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("protocolo").value.trim();
      const resultado = document.getElementById("resultadoConsulta");

      try {
        const res = await fetch(`${API}/denuncias/${id}`);
        if (res.ok) {
          const d = await res.json();
          resultado.innerHTML = `
            <h3>Denúncia #${d.id}</h3>
            <p><strong>Tipo:</strong> ${d.tipo}</p>
            <p><strong>Descrição:</strong> ${d.descricao}</p>
            <p><strong>Local:</strong> ${d.endereco || "Não informado"}</p>
            <p><strong>Data:</strong> ${d.data || "Não informada"}</p>
            <p><strong>Status:</strong> Em análise</p>
          `;
        } else {
          resultado.innerHTML = `<p style="color:red">❌ Denúncia não encontrada.</p>`;
        }
      } catch {
        resultado.innerHTML = `<p style="color:red">❌ Erro ao consultar. Verifique o servidor.</p>`;
      }
    });
  }

});