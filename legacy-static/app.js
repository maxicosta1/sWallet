const STORAGE_KEY = "scodeFinanceApp";
const DAY_MS = 24 * 60 * 60 * 1000;

const dom = {};

const state = {
    clients: [],
    payments: [],
    movements: [],
    exchangeRate: 1200,
    activeView: "dashboard",
    filters: {
        from: "",
        to: "",
        clientId: "",
        currency: "",
        status: ""
    }
};

const storage = {
    load() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            Object.assign(state, seedData());
            this.save();
            return;
        }

        try {
            const parsed = JSON.parse(saved);
            state.clients = parsed.clients || [];
            state.payments = parsed.payments || [];
            state.movements = parsed.movements || [];
            state.exchangeRate = Number(parsed.exchangeRate) || 1200;
        } catch {
            Object.assign(state, seedData());
            this.save();
        }
    },
    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            clients: state.clients,
            payments: state.payments,
            movements: state.movements,
            exchangeRate: state.exchangeRate
        }));
    },
    reset() {
        Object.assign(state, seedData());
        this.save();
    }
};

const calculations = {
    toARS(amount, currency) {
        return currency === "USD" ? Number(amount) * state.exchangeRate : Number(amount);
    },
    totalsForMonth(date = new Date()) {
        const month = date.getMonth();
        const year = date.getFullYear();
        const monthMovements = state.movements.filter(item => isSameMonth(item.date, month, year));
        const monthPayments = state.payments.filter(item => item.status === "pagado" && isSameMonth(item.date, month, year));
        const pendingPayments = state.payments.filter(item => item.status !== "pagado" && isSameMonth(item.dueDate, month, year));

        const paid = sumARS(monthPayments);
        const income = sumARS(monthMovements.filter(item => item.type === "ingreso")) + paid;
        const expenses = sumARS(monthMovements.filter(item => item.type === "salida"));
        const pending = sumARS(pendingPayments);

        return {
            income,
            expenses,
            estimated: income + pending - expenses,
            pending,
            profit: income - expenses
        };
    },
    globalTotals() {
        const paid = state.payments.filter(payment => payment.status === "pagado");
        const incomeMovements = state.movements.filter(item => item.type === "ingreso");
        const expenseMovements = state.movements.filter(item => item.type === "salida");
        const pending = state.payments.filter(payment => payment.status !== "pagado");

        const incomeARS = sumARS(paid) + sumARS(incomeMovements);
        const expensesARS = sumARS(expenseMovements);
        const balanceARS = incomeARS - expensesARS;
        const pendingARS = sumARS(pending);

        return {
            balanceARS,
            pendingARS,
            ars: balanceByCurrency("ARS"),
            usd: balanceByCurrency("USD")
        };
    },
    clientsWithDebt() {
        return state.clients
            .map(client => {
                const debtPayments = state.payments.filter(payment => payment.clientId === client.id && payment.status !== "pagado");
                return {
                    ...client,
                    debt: sumARS(debtPayments),
                    debtOriginal: debtPayments.reduce((total, payment) => total + Number(payment.amount), 0),
                    debtCurrency: debtPayments[0]?.currency || client.currency
                };
            })
            .filter(client => client.debt > 0)
            .sort((a, b) => b.debt - a.debt);
    },
    upcomingPayments() {
        const today = startOfDay(new Date());
        const limit = new Date(today.getTime() + 10 * DAY_MS);
        return state.payments
            .filter(payment => payment.status !== "pagado")
            .map(payment => ({ ...payment, due: startOfDay(parseDate(payment.dueDate)) }))
            .filter(payment => payment.due <= limit)
            .sort((a, b) => a.due - b.due)
            .slice(0, 5);
    },
    monthlySeries() {
        const labels = lastSixMonths();
        return labels.map(label => {
            const paid = state.payments.filter(payment => payment.status === "pagado" && monthKey(payment.date) === label.key);
            const incomeMovements = state.movements.filter(item => item.type === "ingreso" && monthKey(item.date) === label.key);
            const expenses = state.movements.filter(item => item.type === "salida" && monthKey(item.date) === label.key);
            const pending = state.payments.filter(payment => payment.status !== "pagado" && monthKey(payment.dueDate) === label.key);
            const income = sumARS(paid) + sumARS(incomeMovements);
            const expense = sumARS(expenses);

            return {
                label: label.label,
                income,
                expenses: expense,
                balance: income + sumARS(pending) - expense
            };
        });
    }
};

const render = {
    all() {
        syncAutoStatuses();
        populateClientSelects();
        renderBankingHero();
        renderStats();
        renderDashboardLists();
        renderClients();
        renderPayments();
        renderMovements();
        renderReports();
        drawAllCharts();
        dom.exchangeRate.value = state.exchangeRate;
    },
    view(view) {
        state.activeView = view;
        document.querySelectorAll(".view").forEach(panel => panel.classList.toggle("active", panel.dataset.viewPanel === view));
        document.querySelectorAll(".nav-link").forEach(link => link.classList.toggle("active", link.dataset.view === view));
        dom.pageTitle.textContent = titles[view];
        closeMobileMenu();
        drawAllCharts();
    }
};

const titles = {
    dashboard: "Dashboard financiero",
    clientes: "Clientes",
    pagos: "Pagos",
    movimientos: "Movimientos",
    reportes: "Reportes"
};

function seedData() {
    const today = new Date();
    const d = offset => toInputDate(new Date(today.getTime() + offset * DAY_MS));
    const clients = [
        createRecord({ name: "Lucia Fernandez", company: "Norte Lab", email: "lucia@nortelab.com", phone: "+54 9 11 4422 8011", service: "Sitio web institucional", amount: 980000, currency: "ARS", status: "activo" }),
        createRecord({ name: "Martin Rivas", company: "Rivas Legal", email: "martin@rivaslegal.com", phone: "+598 94 222 108", service: "Mantenimiento mensual", amount: 850, currency: "USD", status: "activo" }),
        createRecord({ name: "Camila Soto", company: "Mercado Aura", email: "camila@mercadoaura.com", phone: "+54 9 351 551 9921", service: "Ecommerce y performance", amount: 1500, currency: "USD", status: "pendiente" }),
        createRecord({ name: "Diego Morales", company: "Studio Delta", email: "diego@studiodelta.com", phone: "+54 9 221 392 4830", service: "Identidad visual", amount: 640000, currency: "ARS", status: "finalizado" })
    ];

    return {
        exchangeRate: 1200,
        clients,
        payments: [
            createRecord({ clientId: clients[0].id, amount: 980000, currency: "ARS", date: d(-8), dueDate: d(-3), status: "pagado", method: "Transferencia", notes: "Pago completo del sitio institucional." }),
            createRecord({ clientId: clients[1].id, amount: 850, currency: "USD", date: d(-4), dueDate: d(3), status: "pendiente", method: "Wise", notes: "Fee mensual de soporte." }),
            createRecord({ clientId: clients[2].id, amount: 1500, currency: "USD", date: d(-18), dueDate: d(-2), status: "vencido", method: "Transferencia", notes: "Primer hito del ecommerce." }),
            createRecord({ clientId: clients[3].id, amount: 640000, currency: "ARS", date: d(-34), dueDate: d(-25), status: "pagado", method: "Transferencia", notes: "Cierre de branding." }),
            createRecord({ clientId: clients[0].id, amount: 420000, currency: "ARS", date: d(1), dueDate: d(7), status: "pendiente", method: "Mercado Pago", notes: "Upsell de optimizacion SEO." })
        ],
        movements: [
            createRecord({ type: "ingreso", category: "Consultoria", amount: 380, currency: "USD", date: d(-12), description: "Sesion estrategica para cliente puntual." }),
            createRecord({ type: "salida", category: "Software", amount: 95, currency: "USD", date: d(-10), description: "Herramientas de diseno y automatizacion." }),
            createRecord({ type: "salida", category: "Impuestos", amount: 210000, currency: "ARS", date: d(-7), description: "Pago mensual de obligaciones." }),
            createRecord({ type: "ingreso", category: "Soporte", amount: 260000, currency: "ARS", date: d(-5), description: "Bolsa de horas tecnica." }),
            createRecord({ type: "salida", category: "Marketing", amount: 120000, currency: "ARS", date: d(-2), description: "Campana de adquisicion." })
        ]
    };
}

function bindDom() {
    [
        "sidebar", "mobileBackdrop", "menuToggle", "pageTitle", "exchangeRate", "saveRate", "resetDemo",
        "heroBalance", "heroArs", "heroUsd", "heroRate", "heroForecast", "heroProfit",
        "statsGrid", "upcomingPayments", "debtClientsTable", "recentActivity", "miniFlowChart",
        "clientForm", "clientId", "clientName", "clientCompany", "clientEmail", "clientPhone", "clientService",
        "clientAmount", "clientCurrency", "clientStatus", "clientFormTitle", "cancelClientEdit", "clientsTable",
        "paymentForm", "paymentId", "paymentClient", "paymentAmount", "paymentCurrency", "paymentDate",
        "paymentDueDate", "paymentStatus", "paymentMethod", "paymentNotes", "paymentFormTitle", "cancelPaymentEdit", "paymentsTable",
        "movementForm", "movementId", "movementCategory", "movementAmount", "movementCurrency", "movementDate",
        "movementDescription", "movementFormTitle", "cancelMovementEdit", "movementsTable",
        "filterFrom", "filterTo", "filterClient", "filterCurrency", "filterStatus", "clearFilters",
        "monthlyChart", "balanceChart", "reportsTable", "toastRegion"
    ].forEach(id => {
        dom[id] = document.getElementById(id);
    });
}

function bindEvents() {
    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", () => render.view(link.dataset.view));
    });
    document.querySelectorAll(".action-bubble").forEach(button => {
        button.addEventListener("click", () => render.view(button.dataset.view));
    });

    document.querySelector("[data-quick-action='payment']").addEventListener("click", () => render.view("pagos"));
    dom.menuToggle.addEventListener("click", openMobileMenu);
    dom.mobileBackdrop.addEventListener("click", closeMobileMenu);
    dom.saveRate.addEventListener("click", saveExchangeRate);
    dom.resetDemo.addEventListener("click", resetDemoData);

    dom.clientForm.addEventListener("submit", handleClientSubmit);
    dom.cancelClientEdit.addEventListener("click", resetClientForm);
    dom.paymentForm.addEventListener("submit", handlePaymentSubmit);
    dom.cancelPaymentEdit.addEventListener("click", resetPaymentForm);
    dom.movementForm.addEventListener("submit", handleMovementSubmit);
    dom.cancelMovementEdit.addEventListener("click", resetMovementForm);

    [dom.filterFrom, dom.filterTo, dom.filterClient, dom.filterCurrency, dom.filterStatus].forEach(control => {
        control.addEventListener("input", updateFilters);
    });
    dom.clearFilters.addEventListener("click", clearFilters);

    window.addEventListener("resize", debounce(drawAllCharts, 150));
}

function renderStats() {
    const month = calculations.totalsForMonth();
    const totals = calculations.globalTotals();
    const debts = calculations.clientsWithDebt().length;
    const upcoming = calculations.upcomingPayments().length;
    const cards = [
        ["Saldo total", formatARS(totals.balanceARS), "Consolidado con cotizacion actual", "green"],
        ["Ingresos del mes", formatARS(month.income), "Pagos cobrados + ingresos", "blue"],
        ["Gastos del mes", formatARS(month.expenses), "Salidas registradas", "coral"],
        ["Estimado del mes", formatARS(month.estimated), "Ingresos + pendientes - gastos", ""],
        ["Total ARS", formatMoney(totals.ars, "ARS"), "Caja neta en pesos", ""],
        ["Total USD", formatMoney(totals.usd, "USD"), "Caja neta en dolares", "blue"],
        ["Clientes con deuda", debts.toString(), "Cuentas con pagos pendientes", "coral"],
        ["Pagos proximos", upcoming.toString(), "Vencen dentro de 10 dias", "green"]
    ];

    dom.statsGrid.innerHTML = cards.map(([label, value, hint, tone]) => `
        <article class="stat-card ${tone}">
            <span>${label}</span>
            <strong>${value}</strong>
            <small>${hint}</small>
        </article>
    `).join("");
}

function renderBankingHero() {
    const month = calculations.totalsForMonth();
    const totals = calculations.globalTotals();
    dom.heroBalance.textContent = formatARS(totals.balanceARS);
    dom.heroArs.textContent = formatMoney(totals.ars, "ARS");
    dom.heroUsd.textContent = formatMoney(totals.usd, "USD");
    dom.heroRate.textContent = formatARS(state.exchangeRate);
    dom.heroForecast.textContent = formatARS(month.estimated);
    dom.heroProfit.textContent = formatARS(month.profit);
    dom.heroProfit.className = month.profit >= 0 ? "amount-positive" : "amount-negative";
}

function renderDashboardLists() {
    const upcoming = calculations.upcomingPayments();
    dom.upcomingPayments.innerHTML = upcoming.length ? upcoming.map(payment => {
        const client = getClient(payment.clientId);
        return `
            <article class="list-item">
                <div>
                    <strong>${escapeHTML(client?.company || "Cliente eliminado")}</strong>
                    <span>Vence ${formatDate(payment.dueDate)} - ${escapeHTML(payment.method)}</span>
                </div>
                <div>
                    <strong class="${payment.status === "vencido" ? "amount-negative" : "amount-neutral"}">${formatMoney(payment.amount, payment.currency)}</strong>
                    <span class="badge ${payment.status}">${payment.status}</span>
                </div>
            </article>
        `;
    }).join("") : emptyState("No hay pagos proximos a vencer.");

    const debts = calculations.clientsWithDebt();
    dom.debtClientsTable.innerHTML = debts.length ? debts.map(client => `
        <tr>
            <td><div class="entity-title"><strong>${escapeHTML(client.name)}</strong><span>${escapeHTML(client.company)}</span></div></td>
            <td>${escapeHTML(client.service)}</td>
            <td>${formatARS(client.debt)}</td>
            <td><span class="badge ${client.status}">${client.status}</span></td>
        </tr>
    `).join("") : tableEmpty(4, "No hay clientes con deuda.");

    const recent = getActivityRows().slice(0, 5);
    dom.recentActivity.innerHTML = recent.length ? recent.map(item => `
        <article class="list-item">
            <div>
                <strong>${escapeHTML(item.title)}</strong>
                <span>${formatDate(item.date)} - ${escapeHTML(item.detail)}</span>
            </div>
            <strong class="${item.type === "salida" ? "amount-negative" : "amount-positive"}">${item.sign}${formatMoney(item.amount, item.currency)}</strong>
        </article>
    `).join("") : emptyState("Todavia no hay movimientos.");
}

function renderClients() {
    dom.clientsTable.innerHTML = state.clients.length ? state.clients.map(client => `
        <tr>
            <td><div class="entity-title"><strong>${escapeHTML(client.name)}</strong><span>${escapeHTML(client.company)} - ${escapeHTML(client.email)}</span></div></td>
            <td>${escapeHTML(client.service)}</td>
            <td>${formatMoney(client.amount, client.currency)}</td>
            <td><span class="badge ${client.status}">${client.status}</span></td>
            <td>
                <div class="actions-cell">
                    <button class="ghost-button compact" type="button" onclick="editClient('${client.id}')">Editar</button>
                    <button class="danger-button compact" type="button" onclick="deleteClient('${client.id}')">Eliminar</button>
                </div>
            </td>
        </tr>
    `).join("") : tableEmpty(5, "No hay clientes registrados.");
}

function renderPayments() {
    const sorted = [...state.payments].sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
    dom.paymentsTable.innerHTML = sorted.length ? sorted.map(payment => {
        const client = getClient(payment.clientId);
        return `
            <tr>
                <td><div class="entity-title"><strong>${escapeHTML(client?.company || "Cliente eliminado")}</strong><span>${escapeHTML(client?.name || "")}</span></div></td>
                <td>${formatMoney(payment.amount, payment.currency)}</td>
                <td>${formatDate(payment.date)}</td>
                <td>${formatDate(payment.dueDate)}</td>
                <td><span class="badge ${payment.status}">${payment.status}</span></td>
                <td>
                    <div class="actions-cell">
                        <button class="ghost-button compact" type="button" onclick="editPayment('${payment.id}')">Editar</button>
                        <button class="danger-button compact" type="button" onclick="deletePayment('${payment.id}')">Eliminar</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("") : tableEmpty(6, "No hay pagos registrados.");
}

function renderMovements() {
    const sorted = [...state.movements].sort((a, b) => new Date(b.date) - new Date(a.date));
    dom.movementsTable.innerHTML = sorted.length ? sorted.map(item => `
        <tr>
            <td><span class="badge ${item.type}">${item.type}</span></td>
            <td>${escapeHTML(item.category)}</td>
            <td class="${item.type === "salida" ? "amount-negative" : "amount-positive"}">${item.type === "salida" ? "-" : "+"}${formatMoney(item.amount, item.currency)}</td>
            <td>${formatDate(item.date)}</td>
            <td>${escapeHTML(item.description)}</td>
            <td>
                <div class="actions-cell">
                    <button class="ghost-button compact" type="button" onclick="editMovement('${item.id}')">Editar</button>
                    <button class="danger-button compact" type="button" onclick="deleteMovement('${item.id}')">Eliminar</button>
                </div>
            </td>
        </tr>
    `).join("") : tableEmpty(6, "No hay movimientos registrados.");
}

function renderReports() {
    const rows = getActivityRows().filter(matchesFilters);
    dom.reportsTable.innerHTML = rows.length ? rows.map(item => `
        <tr>
            <td>${escapeHTML(item.origin)}</td>
            <td>${escapeHTML(item.title)}</td>
            <td class="${item.type === "salida" ? "amount-negative" : "amount-positive"}">${item.sign}${formatMoney(item.amount, item.currency)}</td>
            <td>${formatDate(item.date)}</td>
            <td>${item.status ? `<span class="badge ${item.status}">${item.status}</span>` : `<span class="badge ${item.type}">${item.type}</span>`}</td>
            <td>${escapeHTML(item.detail)}</td>
        </tr>
    `).join("") : tableEmpty(6, "No hay resultados con los filtros actuales.");
}

function populateClientSelects() {
    const options = [`<option value="">Todos</option>`].concat(state.clients.map(client => `<option value="${client.id}">${escapeHTML(client.company)} - ${escapeHTML(client.name)}</option>`));
    dom.filterClient.innerHTML = options.join("");
    dom.filterClient.value = state.filters.clientId;

    dom.paymentClient.innerHTML = state.clients.length
        ? state.clients.map(client => `<option value="${client.id}">${escapeHTML(client.company)} - ${escapeHTML(client.name)}</option>`).join("")
        : `<option value="">Crea un cliente primero</option>`;
}

function handleClientSubmit(event) {
    event.preventDefault();
    if (!validateForm(dom.clientForm)) return;

    const payload = {
        name: dom.clientName.value.trim(),
        company: dom.clientCompany.value.trim(),
        email: dom.clientEmail.value.trim(),
        phone: dom.clientPhone.value.trim(),
        service: dom.clientService.value.trim(),
        amount: Number(dom.clientAmount.value),
        currency: dom.clientCurrency.value,
        status: dom.clientStatus.value
    };

    if (dom.clientId.value) {
        updateRecord(state.clients, dom.clientId.value, payload);
        notify("Cliente actualizado", "Los datos quedaron guardados.");
    } else {
        state.clients.push(createRecord(payload));
        notify("Cliente creado", "Ya esta disponible para pagos y reportes.");
    }

    storage.save();
    resetClientForm();
    render.all();
}

function handlePaymentSubmit(event) {
    event.preventDefault();
    if (!state.clients.length) {
        notify("Falta un cliente", "Crea un cliente antes de registrar pagos.");
        return;
    }
    if (!validateForm(dom.paymentForm)) return;

    const payload = {
        clientId: dom.paymentClient.value,
        amount: Number(dom.paymentAmount.value),
        currency: dom.paymentCurrency.value,
        date: dom.paymentDate.value,
        dueDate: dom.paymentDueDate.value,
        status: dom.paymentStatus.value,
        method: dom.paymentMethod.value.trim(),
        notes: dom.paymentNotes.value.trim()
    };

    if (dom.paymentId.value) {
        updateRecord(state.payments, dom.paymentId.value, payload);
        notify("Pago actualizado", "El estado financiero fue recalculado.");
    } else {
        state.payments.push(createRecord(payload));
        notify("Pago registrado", "El dashboard ya refleja el movimiento.");
    }

    storage.save();
    resetPaymentForm();
    render.all();
}

function handleMovementSubmit(event) {
    event.preventDefault();
    if (!validateForm(dom.movementForm)) return;

    const payload = {
        type: document.querySelector("input[name='movementType']:checked").value,
        category: dom.movementCategory.value.trim(),
        amount: Number(dom.movementAmount.value),
        currency: dom.movementCurrency.value,
        date: dom.movementDate.value,
        description: dom.movementDescription.value.trim()
    };

    if (dom.movementId.value) {
        updateRecord(state.movements, dom.movementId.value, payload);
        notify("Movimiento actualizado", "Los reportes fueron recalculados.");
    } else {
        state.movements.push(createRecord(payload));
        notify("Movimiento registrado", "Ya aparece en historial y reportes.");
    }

    storage.save();
    resetMovementForm();
    render.all();
}

function editClient(id) {
    const client = state.clients.find(item => item.id === id);
    if (!client) return;
    dom.clientId.value = client.id;
    dom.clientName.value = client.name;
    dom.clientCompany.value = client.company;
    dom.clientEmail.value = client.email;
    dom.clientPhone.value = client.phone;
    dom.clientService.value = client.service;
    dom.clientAmount.value = client.amount;
    dom.clientCurrency.value = client.currency;
    dom.clientStatus.value = client.status;
    dom.clientFormTitle.textContent = "Editar cliente";
    render.view("clientes");
}

function deleteClient(id) {
    const hasPayments = state.payments.some(payment => payment.clientId === id);
    if (hasPayments && !confirm("Este cliente tiene pagos asociados. Si lo eliminas, los pagos quedaran como cliente eliminado. ¿Continuar?")) return;
    state.clients = state.clients.filter(client => client.id !== id);
    storage.save();
    render.all();
    notify("Cliente eliminado", "Se removio del listado principal.");
}

function editPayment(id) {
    const payment = state.payments.find(item => item.id === id);
    if (!payment) return;
    dom.paymentId.value = payment.id;
    dom.paymentClient.value = payment.clientId;
    dom.paymentAmount.value = payment.amount;
    dom.paymentCurrency.value = payment.currency;
    dom.paymentDate.value = payment.date;
    dom.paymentDueDate.value = payment.dueDate;
    dom.paymentStatus.value = payment.status;
    dom.paymentMethod.value = payment.method;
    dom.paymentNotes.value = payment.notes;
    dom.paymentFormTitle.textContent = "Editar pago";
    render.view("pagos");
}

function deletePayment(id) {
    state.payments = state.payments.filter(payment => payment.id !== id);
    storage.save();
    render.all();
    notify("Pago eliminado", "El saldo fue actualizado.");
}

function editMovement(id) {
    const movement = state.movements.find(item => item.id === id);
    if (!movement) return;
    dom.movementId.value = movement.id;
    document.querySelector(`input[name='movementType'][value='${movement.type}']`).checked = true;
    dom.movementCategory.value = movement.category;
    dom.movementAmount.value = movement.amount;
    dom.movementCurrency.value = movement.currency;
    dom.movementDate.value = movement.date;
    dom.movementDescription.value = movement.description;
    dom.movementFormTitle.textContent = "Editar movimiento";
    render.view("movimientos");
}

function deleteMovement(id) {
    state.movements = state.movements.filter(movement => movement.id !== id);
    storage.save();
    render.all();
    notify("Movimiento eliminado", "Los reportes fueron actualizados.");
}

function resetClientForm() {
    dom.clientForm.reset();
    dom.clientId.value = "";
    dom.clientFormTitle.textContent = "Crear cliente";
    clearErrors(dom.clientForm);
}

function resetPaymentForm() {
    dom.paymentForm.reset();
    dom.paymentId.value = "";
    dom.paymentDate.value = toInputDate(new Date());
    dom.paymentDueDate.value = toInputDate(new Date(Date.now() + 7 * DAY_MS));
    dom.paymentFormTitle.textContent = "Registrar pago";
    clearErrors(dom.paymentForm);
}

function resetMovementForm() {
    dom.movementForm.reset();
    dom.movementId.value = "";
    dom.movementDate.value = toInputDate(new Date());
    dom.movementFormTitle.textContent = "Registrar movimiento";
    clearErrors(dom.movementForm);
}

function saveExchangeRate() {
    const value = Number(dom.exchangeRate.value);
    if (!value || value <= 0) {
        dom.exchangeRate.classList.add("field-error");
        notify("Cotizacion invalida", "Ingresa un valor mayor a cero.");
        return;
    }
    dom.exchangeRate.classList.remove("field-error");
    state.exchangeRate = value;
    storage.save();
    render.all();
    notify("Cotizacion actualizada", `1 USD = ${formatARS(value)}.`);
}

function resetDemoData() {
    if (!confirm("Esto reemplazara los datos guardados por datos de ejemplo. ¿Continuar?")) return;
    storage.reset();
    resetClientForm();
    resetPaymentForm();
    resetMovementForm();
    render.all();
    notify("Demo reiniciada", "Los datos de ejemplo fueron restaurados.");
}

function updateFilters() {
    state.filters = {
        from: dom.filterFrom.value,
        to: dom.filterTo.value,
        clientId: dom.filterClient.value,
        currency: dom.filterCurrency.value,
        status: dom.filterStatus.value
    };
    renderReports();
}

function clearFilters() {
    dom.filterFrom.value = "";
    dom.filterTo.value = "";
    dom.filterClient.value = "";
    dom.filterCurrency.value = "";
    dom.filterStatus.value = "";
    updateFilters();
}

function validateForm(form) {
    clearErrors(form);
    const controls = [...form.querySelectorAll("[required]")];
    const invalid = controls.filter(control => !String(control.value || "").trim());
    invalid.forEach(control => control.classList.add("field-error"));
    if (invalid.length) {
        notify("Campos incompletos", "Completa los campos marcados para continuar.");
        invalid[0].focus();
        return false;
    }
    return true;
}

function clearErrors(form) {
    form.querySelectorAll(".field-error").forEach(control => control.classList.remove("field-error"));
}

function drawAllCharts() {
    drawBarChart(dom.monthlyChart, calculations.monthlySeries());
    drawLineChart(dom.balanceChart, calculations.monthlySeries());
    drawMiniChart(dom.miniFlowChart, calculations.monthlySeries());
}

function drawBarChart(canvas, rows) {
    if (!canvas) return;
    const ctx = setupCanvas(canvas);
    const { width, height } = canvas.getBoundingClientRect();
    const max = Math.max(...rows.flatMap(row => [row.income, row.expenses]), 1);
    const chartHeight = height - 54;
    const slot = width / rows.length;
    ctx.clearRect(0, 0, width, height);
    drawGrid(ctx, width, height);

    rows.forEach((row, index) => {
        const x = index * slot + slot * 0.22;
        const incomeHeight = (row.income / max) * chartHeight;
        const expenseHeight = (row.expenses / max) * chartHeight;
        roundRect(ctx, x, height - incomeHeight - 28, slot * 0.22, incomeHeight, 8, "#9f5cff");
        roundRect(ctx, x + slot * 0.28, height - expenseHeight - 28, slot * 0.22, expenseHeight, 8, "#ff7a59");
        ctx.fillStyle = "#a9a7ba";
        ctx.font = "12px Inter";
        ctx.fillText(row.label, x - 4, height - 8);
    });
}

function drawLineChart(canvas, rows) {
    if (!canvas) return;
    const ctx = setupCanvas(canvas);
    const { width, height } = canvas.getBoundingClientRect();
    const max = Math.max(...rows.map(row => row.balance), 1);
    const min = Math.min(...rows.map(row => row.balance), 0);
    const range = Math.max(max - min, 1);
    const chartHeight = height - 54;
    const points = rows.map((row, index) => ({
        x: 22 + index * ((width - 44) / Math.max(rows.length - 1, 1)),
        y: 18 + chartHeight - ((row.balance - min) / range) * chartHeight,
        label: row.label
    }));

    ctx.clearRect(0, 0, width, height);
    drawGrid(ctx, width, height);
    ctx.beginPath();
    points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = "#9f5cff";
    ctx.lineWidth = 3;
    ctx.stroke();

    points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#ff7a59";
        ctx.fill();
        ctx.fillStyle = "#a9a7ba";
        ctx.font = "12px Inter";
        ctx.fillText(point.label, point.x - 16, height - 8);
    });
}

function drawMiniChart(canvas, rows) {
    if (!canvas) return;
    const ctx = setupCanvas(canvas);
    const { width, height } = canvas.getBoundingClientRect();
    const totalIncome = rows.reduce((total, row) => total + row.income, 0);
    const totalExpenses = rows.reduce((total, row) => total + row.expenses, 0);
    const max = Math.max(totalIncome, totalExpenses, 1);
    ctx.clearRect(0, 0, width, height);
    drawGrid(ctx, width, height);
    roundRect(ctx, 34, 54, (width - 80) * (totalIncome / max), 42, 16, "#9f5cff");
    roundRect(ctx, 34, 126, (width - 80) * (totalExpenses / max), 42, 16, "#ff7a59");
    ctx.fillStyle = "#f7f5ff";
    ctx.font = "700 14px Inter";
    ctx.fillText("Ingresos", 34, 42);
    ctx.fillText("Egresos", 34, 114);
    ctx.fillStyle = "#a9a7ba";
    ctx.font = "13px Inter";
    ctx.fillText(formatARS(totalIncome), 44, 82);
    ctx.fillText(formatARS(totalExpenses), 44, 154);
}

function setupCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return ctx;
}

function drawGrid(ctx, width, height) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = 1;
    for (let y = 24; y < height - 24; y += 38) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

function roundRect(ctx, x, y, width, height, radius, color) {
    const safeHeight = Math.max(height, 4);
    const safeWidth = Math.max(width, 4);
    ctx.beginPath();
    ctx.roundRect(x, y, safeWidth, safeHeight, radius);
    ctx.fillStyle = color;
    ctx.fill();
}

function getActivityRows() {
    const payments = state.payments.map(payment => {
        const client = getClient(payment.clientId);
        return {
            origin: "Pago",
            title: client?.company || "Cliente eliminado",
            detail: payment.notes || payment.method,
            amount: payment.amount,
            currency: payment.currency,
            date: payment.date,
            type: payment.status === "pagado" ? "ingreso" : "pendiente",
            sign: payment.status === "pagado" ? "+" : "",
            status: payment.status,
            clientId: payment.clientId
        };
    });

    const movements = state.movements.map(item => ({
        origin: item.type === "ingreso" ? "Ingreso" : "Salida",
        title: item.category,
        detail: item.description,
        amount: item.amount,
        currency: item.currency,
        date: item.date,
        type: item.type,
        sign: item.type === "salida" ? "-" : "+",
        status: "",
        clientId: ""
    }));

    return payments.concat(movements).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function matchesFilters(item) {
    const itemDate = startOfDay(parseDate(item.date));
    if (state.filters.from && itemDate < startOfDay(parseDate(state.filters.from))) return false;
    if (state.filters.to && itemDate > startOfDay(parseDate(state.filters.to))) return false;
    if (state.filters.clientId && item.clientId !== state.filters.clientId) return false;
    if (state.filters.currency && item.currency !== state.filters.currency) return false;
    if (state.filters.status && item.status !== state.filters.status) return false;
    return true;
}

function syncAutoStatuses() {
    const today = startOfDay(new Date());
    let changed = false;
    state.payments = state.payments.map(payment => {
        if (payment.status === "pendiente" && startOfDay(parseDate(payment.dueDate)) < today) {
            changed = true;
            return { ...payment, status: "vencido", updatedAt: new Date().toISOString() };
        }
        return payment;
    });
    if (changed) storage.save();
}

function sumARS(items) {
    return items.reduce((total, item) => total + calculations.toARS(item.amount, item.currency), 0);
}

function balanceByCurrency(currency) {
    const paid = state.payments.filter(payment => payment.status === "pagado" && payment.currency === currency);
    const income = state.movements.filter(item => item.type === "ingreso" && item.currency === currency);
    const expenses = state.movements.filter(item => item.type === "salida" && item.currency === currency);
    return paid.reduce((total, item) => total + Number(item.amount), 0)
        + income.reduce((total, item) => total + Number(item.amount), 0)
        - expenses.reduce((total, item) => total + Number(item.amount), 0);
}

function getClient(id) {
    return state.clients.find(client => client.id === id);
}

function createRecord(payload) {
    const now = new Date().toISOString();
    return {
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        ...payload
    };
}

function generateId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function updateRecord(collection, id, payload) {
    const index = collection.findIndex(item => item.id === id);
    if (index === -1) return;
    collection[index] = { ...collection[index], ...payload, updatedAt: new Date().toISOString() };
}

function formatMoney(amount, currency) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency,
        maximumFractionDigits: currency === "ARS" ? 0 : 2
    }).format(Number(amount));
}

function formatARS(amount) {
    return formatMoney(amount, "ARS");
}

function formatDate(date) {
    return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(parseDate(date));
}

function toInputDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseDate(value) {
    if (value instanceof Date) return value;
    const [year, month, day] = String(value).split("-").map(Number);
    if (year && month && day) return new Date(year, month - 1, day);
    return new Date(value);
}

function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameMonth(dateString, month, year) {
    const date = parseDate(dateString);
    return date.getMonth() === month && date.getFullYear() === year;
}

function monthKey(dateString) {
    const date = parseDate(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function lastSixMonths() {
    const current = new Date();
    return Array.from({ length: 6 }, (_, index) => {
        const date = new Date(current.getFullYear(), current.getMonth() - 5 + index, 1);
        return {
            key: monthKey(date),
            label: new Intl.DateTimeFormat("es-AR", { month: "short" }).format(date)
        };
    });
}

function emptyState(message) {
    return `<div class="empty-state">${message}</div>`;
}

function tableEmpty(columns, message) {
    return `<tr><td colspan="${columns}"><div class="empty-state">${message}</div></td></tr>`;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[char]));
}

function notify(title, message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<strong>${escapeHTML(title)}</strong><span>${escapeHTML(message)}</span>`;
    dom.toastRegion.appendChild(toast);
    setTimeout(() => toast.remove(), 3600);
}

function openMobileMenu() {
    dom.sidebar.classList.add("open");
    dom.mobileBackdrop.classList.add("show");
}

function closeMobileMenu() {
    dom.sidebar.classList.remove("open");
    dom.mobileBackdrop.classList.remove("show");
}

function debounce(callback, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => callback(...args), delay);
    };
}

window.editClient = editClient;
window.deleteClient = deleteClient;
window.editPayment = editPayment;
window.deletePayment = deletePayment;
window.editMovement = editMovement;
window.deleteMovement = deleteMovement;

document.addEventListener("DOMContentLoaded", () => {
    bindDom();
    storage.load();
    bindEvents();
    resetPaymentForm();
    resetMovementForm();
    render.all();
});
