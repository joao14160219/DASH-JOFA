const PRICES = { ceu: 119, balada: 129, inferno: 139 };
const LABELS = { ceu: "Céu", balada: "Balada", inferno: "Inferno" };

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function computeStats(rows) {
  const editions = ["ceu", "balada", "inferno"].map((key) => {
    const count = rows.filter((row) => row.edicao === key).length;
    const revenue = count * PRICES[key];
    const percentage = rows.length ? Math.round((count / rows.length) * 100) : 0;

    return {
      key,
      label: LABELS[key],
      count,
      revenue,
      percentage,
      price: PRICES[key],
    };
  });

  const totalPeople = rows.length;
  const estimatedRevenue = editions.reduce((sum, item) => sum + item.revenue, 0);
  const averageTicket = totalPeople ? estimatedRevenue / totalPeople : 0;

  return {
    totals: {
      totalPeople,
      estimatedRevenue,
      averageTicket,
      latestLeadAt: rows[0]?.created_at || null,
    },
    editions,
    recentLeads: rows.slice(0, 12),
  };
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return json(res, 500, {
      error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables",
    });
  }

  const endpoint =
    `${supabaseUrl}/rest/v1/waitlist` +
    "?select=id,nome,email,whatsapp,edicao,created_at" +
    "&order=created_at.desc";

  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!response.ok) {
      return json(res, response.status, {
        error: "Supabase request failed",
        details: data,
      });
    }

    const rows = Array.isArray(data) ? data : [];
    return json(res, 200, computeStats(rows));
  } catch (error) {
    return json(res, 500, {
      error: "Unexpected dashboard API error",
      details: String(error),
    });
  }
};
