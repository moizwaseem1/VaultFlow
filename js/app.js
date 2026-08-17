const btnExpense = document.getElementById('btnExpense');
const btnIncome = document.getElementById('btnIncome');
const txType = document.getElementById('txType');
const txDate = document.getElementById('txDate');
const txProof = document.getElementById('txProof');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const transactionForm = document.getElementById('transactionForm');
const txAmount = document.getElementById('txAmount');
const txMethod = document.getElementById('txMethod');
const txReason = document.getElementById('txReason');
const statementsList = document.getElementById('statementsList');
const emptyState = document.getElementById('emptyState');
const totalBalanceEl = document.getElementById('totalBalance');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const filterStart = document.getElementById('filterStart');
const filterEnd = document.getElementById('filterEnd');
const filterMethod = document.getElementById('filterMethod');
const btnApplyFilter = document.getElementById('btnApplyFilter');

txDate.valueAsDate = new Date();

btnExpense.addEventListener('click', () => {
    txType.value = 'expense';
    btnExpense.className = 'w-full py-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg font-medium border-2 border-red-500 transition-all';
    btnIncome.className = 'w-full py-2 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-lg font-medium border-2 border-transparent transition-all';
});

btnIncome.addEventListener('click', () => {
    txType.value = 'income';
    btnIncome.className = 'w-full py-2 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-lg font-medium border-2 border-green-500 transition-all';
    btnExpense.className = 'w-full py-2 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-lg font-medium border-2 border-transparent transition-all';
});

txProof.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        fileNameDisplay.textContent = e.target.files[0].name;
        fileNameDisplay.classList.add('text-primary');
    } else {
        fileNameDisplay.textContent = 'PNG, JPG, PDF up to 10MB';
        fileNameDisplay.classList.remove('text-primary');
    }
});

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
};

const renderTable = (data) => {
    statementsList.innerHTML = '';
    
    if (data.length === 0) {
        emptyState.classList.remove('hidden');
        statementsList.parentElement.classList.add('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    statementsList.parentElement.classList.remove('hidden');
    
    data.forEach(item => {
        const tr = document.createElement('tr');
        const methodIcon = item.method === 'card' ? 'fa-credit-card' : item.method === 'cash' ? 'fa-money-bill-wave' : item.method === 'bank' ? 'fa-building-columns' : 'fa-wallet';
        const typeColor = item.type === 'income' ? 'text-green-500' : 'text-red-500';
        const sign = item.type === 'income' ? '+' : '-';
        
        let proofHtml = '<span class="text-xs text-gray-400">None</span>';
        if (item.proof) {
            proofHtml = `<a href="${item.proof}" download="${item.proofName}" class="text-primary hover:text-blue-600" title="Download Proof"><i class="fa-solid fa-paperclip"></i></a>`;
        }

        tr.innerHTML = `
            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">${item.date}</td>
            <td class="px-3 py-4 text-sm text-gray-900 dark:text-gray-300">
                <div class="flex items-center gap-2">
                    <i class="fa-solid ${methodIcon} text-gray-400"></i>
                    <span class="capitalize font-medium">${item.method}</span>
                </div>
                <div class="text-xs text-gray-500 mt-1">${item.reason || 'No reason'}</div>
            </td>
            <td class="px-3 py-4 whitespace-nowrap text-sm text-right font-medium ${typeColor}">
                ${sign} ${formatCurrency(item.amount)}
            </td>
            <td class="px-3 py-4 whitespace-nowrap text-sm text-center">
                ${proofHtml}
            </td>
            <td class="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="handleDelete(${item.id})" class="text-red-500 hover:text-red-700 transition">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;
        statementsList.appendChild(tr);
    });
};

const loadData = async () => {
    let data = await getStatements();
    
    const sDate = filterStart.value;
    const eDate = filterEnd.value;
    const method = filterMethod.value;
    
    if (sDate) data = data.filter(d => d.date >= sDate);
    if (eDate) data = data.filter(d => d.date <= eDate);
    if (method !== 'all') data = data.filter(d => d.method === method);
    
    let income = 0;
    let expense = 0;
    
    data.forEach(item => {
        if (item.type === 'income') income += parseFloat(item.amount);
        else expense += parseFloat(item.amount);
    });
    
    const balance = income - expense;
    
    totalIncomeEl.textContent = formatCurrency(income);
    totalExpenseEl.textContent = formatCurrency(expense);
    totalBalanceEl.textContent = formatCurrency(balance);
    
    renderTable(data);
};

window.handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this statement?')) {
        await deleteStatement(id);
        loadData();
    }
};

transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const statement = {
        type: txType.value,
        amount: parseFloat(txAmount.value),
        method: txMethod.value,
        date: txDate.value,
        reason: txReason.value,
        timestamp: new Date().getTime()
    };
    
    const file = txProof.files[0];
    await addStatement(statement, file);
    
    transactionForm.reset();
    txDate.valueAsDate = new Date();
    fileNameDisplay.textContent = 'PNG, JPG, PDF up to 10MB';
    fileNameDisplay.classList.remove('text-primary');
    
    loadData();
});

btnApplyFilter.addEventListener('click', loadData);

initDB().then(() => {
    loadData();
}).catch(console.error);

const btnGeneratePDF = document.getElementById('btnGeneratePDF');

btnGeneratePDF.addEventListener('click', async () => {
    // 1. Fetch and filter data exactly like the table view
    let data = await getStatements();
    const sDate = filterStart.value;
    const eDate = filterEnd.value;
    const method = filterMethod.value;
    
    if (sDate) data = data.filter(d => d.date >= sDate);
    if (eDate) data = data.filter(d => d.date <= eDate);
    if (method !== 'all') data = data.filter(d => d.method === method);
    
    if (data.length === 0) {
        alert('No statements found for the selected filters.');
        return;
    }

    // 2. Calculate Totals
    let income = 0;
    let expense = 0;
    data.forEach(item => {
        if (item.type === 'income') income += parseFloat(item.amount);
        else expense += parseFloat(item.amount);
    });
    const balance = income - expense;

    // 3. Initialize PDF Document
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header section
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // darkBg color
    doc.text('VaultFlow Account Statement', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // gray-500
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Date Range: ${sDate || 'All Time'}  to  ${eDate || 'All Time'}`, 14, 36);
    doc.text(`Method Filter: ${method.charAt(0).toUpperCase() + method.slice(1)}`, 14, 42);
    
    // Summary section
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 46, 196, 46);
    
    doc.setFontSize(11);
    doc.setTextColor(34, 197, 94); // green-500
    doc.text(`Total Income: +${formatCurrency(income)}`, 14, 54);
    
    doc.setTextColor(239, 68, 68); // red-500
    doc.text(`Total Expense: -${formatCurrency(expense)}`, 75, 54);
    
    doc.setFont(undefined, 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Closing Balance: ${formatCurrency(balance)}`, 140, 54);
    doc.setFont(undefined, 'normal');
    
    // 4. Map data for AutoTable
    const tableData = data.map(item => [
        item.date,
        item.method.charAt(0).toUpperCase() + item.method.slice(1),
        item.reason || '-',
        item.type === 'income' ? '(+)' : '(-)',
        formatCurrency(item.amount)
    ]);
    
    // 5. Generate Table
    doc.autoTable({
        startY: 62,
        head: [['Date', 'Method', 'Reason', 'Type', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }, // Primary blue color
        columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 25 },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 15, halign: 'center' },
            4: { cellWidth: 35, halign: 'right' }
        },
        didParseCell: function(data) {
            // Color code the 'Type' and 'Amount' columns based on income/expense
            if (data.section === 'body' && (data.column.index === 3 || data.column.index === 4)) {
                if (data.row.raw[3] === '(+)') {
                    data.cell.styles.textColor = [34, 197, 94]; // Green
                } else {
                    data.cell.styles.textColor = [239, 68, 68]; // Red
                }
            }
        }
    });
    
    // 6. Save the file
    const safeStartDate = sDate || 'start';
    const safeEndDate = eDate || 'end';
    doc.save(`VaultFlow Statement ${safeStartDate} to ${safeEndDate}.pdf`);
});

let deferredPrompt;
const installAppBtn = document.getElementById('installAppBtn');
const installAppBtnMobile = document.getElementById('installAppBtnMobile');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    if(installAppBtn) installAppBtn.classList.remove('hidden');
    if(installAppBtnMobile) installAppBtnMobile.classList.remove('hidden');
});

const installApp = async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            deferredPrompt = null;
            if(installAppBtn) installAppBtn.classList.add('hidden');
            if(installAppBtnMobile) installAppBtnMobile.classList.add('hidden');
        }
    }
};

if(installAppBtn) installAppBtn.addEventListener('click', installApp);
if(installAppBtnMobile) installAppBtnMobile.addEventListener('click', installApp);
