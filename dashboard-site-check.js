
const PRICES = { ceu: 119, balada: 129, inferno: 139 };
const LABELS = { ceu: "Céu", balada: "Balada", inferno: "Inferno" };
const COLORS = { ceu: "#6ebdff", balada: "#ff4fd8", inferno: "#ff6a00" };

const totalPeopleEl = document.getElementById("totalPeople");
const estimatedRevenueEl = document.getElementById("estimatedRevenue");
const averageTicketEl = document.getElementById("averageTicket");
const latestLeadEl = document.getElementById("latestLead");
const editionCardsEl = document.getElementById("editionCards");
const barListEl = document.getElementById("barList");
const donutChartEl = document.getElementById("donutChart");
const donutTotalEl = document.getElementById("donutTotal");
const leadRowsEl = document.getElementById("leadRows");
const stateTextEl = document.getElementById("stateText");
const lastUpdatedEl = document.getElementById("lastUpdated");
const refreshBtn = document.getElementById("refreshBtn");

function brl(value){
  return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(value);
}

function formatDate(value){
  if(!value) return "--";
  const date = new Date(value);
  if(Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(date);
}

function relativeDate(value){
  if(!value) return "--";
  const date = new Date(value);
  if(Number.isNaN(date.getTime())) return "--";
  return new Intl.RelativeTimeFormat("pt-BR",{numeric:"auto"}).format(
    Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60)),
    "hour"
  );
}

function editionStats(rows){
  return ["ceu","balada","inferno"].map((key)=>{
    const count = rows.filter((row)=>row.edicao===key).length;
    const revenue = count * PRICES[key];
    const percentage = rows.length ? Math.round((count / rows.length) * 100) : 0;
    return { key, label: LABELS[key], count, revenue, percentage };
  });
}

function renderEditionCards(stats){
  editionCardsEl.innerHTML = stats.map((item)=>`
    <div class="edition" style="box-shadow: inset 0 0 0 1px ${COLORS[item.key]}22;">
      <div class="edition-head">
        <div class="edition-name" style="color:${COLORS[item.key]}">${item.label}</div>
        <div class="edition-tag" style="color:${COLORS[item.key]}">${item.percentage}% da fila</div>
      </div>
      <div class="edition-stats">
        <div class="mini">
          <div class="mini-label">Pessoas</div>
          <div class="mini-value">${item.count}</div>
        </div>
        <div class="mini">
          <div class="mini-label">Receita</div>
          <div class="mini-value">${brl(item.revenue)}</div>
        </div>
        <div class="mini">
          <div class="mini-label">Preço</div>
          <div class="mini-value">${brl(PRICES[item.key])}</div>
        </div>
      </div>
    </div>
  `).join("");
}

function renderBars(stats){
  const total = stats.reduce((sum, item)=>sum + item.count, 0);
  const ceuAngle = total ? (stats[0].count / total) * 360 : 0;
  const baladaAngle = total ? (stats[1].count / total) * 360 : 0;
  const baladaEnd = ceuAngle + baladaAngle;

  donutChartEl.style.setProperty("--ceu", `${ceuAngle}deg`);
  donutChartEl.style.setProperty("--balada", `${ceuAngle}deg`);
  donutChartEl.style.setProperty("--balada-end", `${baladaEnd}deg`);
  donutTotalEl.textContent = total;

  barListEl.innerHTML = stats.map((item)=>`
    <div class="legend-item">
      <div class="legend-dot" style="background:${COLORS[item.key]}"></div>
      <div>
        <div class="legend-name" style="color:${COLORS[item.key]}">${item.label}</div>
        <div class="legend-share">${brl(item.revenue)} estimados</div>
      </div>
      <div class="legend-meta">
        <div class="legend-value">${item.count}</div>
        <div class="legend-share">${item.percentage}%</div>
      </div>
    </div>
  `).join("");
}

function renderRows(rows){
  if(!rows.length){
    leadRowsEl.innerHTML = `<tr><td colspan="5" style="color:var(--muted);">Nenhum cadastro encontrado.</td></tr>`;
    return;
  }

  leadRowsEl.innerHTML = rows.slice(0, 12).map((row)=>`
    <tr>
      <td>${row.nome || "--"}</td>
      <td><span class="pill ${row.edicao || ""}">${LABELS[row.edicao] || row.edicao || "--"}</span></td>
      <td>${row.email || "--"}</td>
      <td>${row.whatsapp || "--"}</td>
      <td>${formatDate(row.created_at)}</td>
    </tr>
  `).join("");
}

async function loadDashboard(){
  stateTextEl.textContent = "Atualizando dashboard...";
  stateTextEl.classList.remove("error");

  const response = await fetch("/api/dashboard");
  const payload = await response.json();

  if(!response.ok){
    stateTextEl.textContent = "Não foi possível carregar a API do dashboard. Verifique a configuração da Vercel e das variáveis do Supabase.";
    stateTextEl.classList.add("error");
    console.error(payload);
    return;
  }

  const rows = payload.recentLeads || [];
  const stats = payload.editions || [];
  const totalPeople = payload.totals?.totalPeople || 0;
  const estimatedRevenue = payload.totals?.estimatedRevenue || 0;
  const averageTicket = payload.totals?.averageTicket || 0;
  const latest = payload.totals?.latestLeadAt || null;

  totalPeopleEl.textContent = totalPeople;
  estimatedRevenueEl.textContent = brl(estimatedRevenue);
  averageTicketEl.textContent = totalPeople ? brl(averageTicket) : brl(0);
  latestLeadEl.textContent = latest ? relativeDate(latest) : "--";

  renderEditionCards(stats);
  renderBars(stats);
  renderRows(rows);

  stateTextEl.textContent = `${totalPeople} cadastro(s) carregado(s) com sucesso.`;
  lastUpdatedEl.textContent = `Última atualização: ${formatDate(new Date().toISOString())}`;
}

refreshBtn.addEventListener("click", loadDashboard);
loadDashboard();
