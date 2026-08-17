import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, updateProfile, updatePassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc, doc, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCVcGA1FO0XXU0Em_s6MLfU8nCx_n3pqvs",
  authDomain: "vaultflow-5c68b.firebaseapp.com",
  projectId: "vaultflow-5c68b",
  storageBucket: "vaultflow-5c68b.firebasestorage.app",
  messagingSenderId: "783409757161",
  appId: "1:783409757161:web:6b828cb7759d92012ea978",
  measurementId: "G-LFLQZ5880H"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const splashScreen = document.getElementById('splashScreen');
const splashText = document.getElementById('splashText');
const authScreen = document.getElementById('authScreen');
const appContainer = document.getElementById('appContainer');
const authForm = document.getElementById('authForm');
const authName = document.getElementById('authName');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const toggleAuthMode = document.getElementById('toggleAuthMode');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const profileBtn = document.getElementById('profileBtn');
const profileDropdown = document.getElementById('profileDropdown');
const navProfilePic = document.getElementById('navProfilePic');
const btnOpenProfilePage = document.getElementById('btnOpenProfilePage');
const btnSignOut = document.getElementById('btnSignOut');
const dashboardUI = document.getElementById('dashboardUI');
const profileUI = document.getElementById('profileUI');
const btnBackToDash = document.getElementById('btnBackToDash');
const updateNameInput = document.getElementById('updateNameInput');
const btnUpdateName = document.getElementById('btnUpdateName');
const updatePasswordInput = document.getElementById('updatePasswordInput');
const btnUpdatePassword = document.getElementById('btnUpdatePassword');

const btnExpense = document.getElementById('btnExpense');
const btnIncome = document.getElementById('btnIncome');
const txType = document.getElementById('txType');
const txAmount = document.getElementById('txAmount');
const txMethod = document.getElementById('txMethod');
const txDate = document.getElementById('txDate');
const txReason = document.getElementById('txReason');
const txProof = document.getElementById('txProof');
const transactionForm = document.getElementById('transactionForm');
const statementsList = document.getElementById('statementsList');
const totalBalanceEl = document.getElementById('totalBalance');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const filterStart = document.getElementById('filterStart');
const filterEnd = document.getElementById('filterEnd');
const filterMethod = document.getElementById('filterMethod');
const btnApplyFilter = document.getElementById('btnApplyFilter');
const btnGeneratePDF = document.getElementById('btnGeneratePDF');

let isLoginMode = true;
let currentUser = null;

txDate.valueAsDate = new Date();
document.getElementById('currentYear').textContent = new Date().getFullYear();

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
};

const triggerSplash = (name) => {
    authScreen.classList.add('hidden');
    appContainer.classList.add('hidden');
    splashScreen.classList.remove('hidden');
    
    splashText.textContent = `Hi, ${name}!`;
    
    setTimeout(() => {
        splashText.classList.remove('scale-95');
        splashText.classList.add('scale-110');
    }, 100);

    setTimeout(() => {
        splashScreen.classList.add('hidden');
        appContainer.classList.remove('hidden');
        appContainer.classList.add('flex');
        loadData();
    }, 4500);
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        const displayName = user.displayName || 'User';
        navProfilePic.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff`;
        updateNameInput.value = displayName;
        triggerSplash(displayName);
    } else {
        currentUser = null;
        appContainer.classList.add('hidden');
        appContainer.classList.remove('flex');
        splashScreen.classList.add('hidden');
        authScreen.classList.remove('hidden');
    }
});

toggleAuthMode.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
        authName.classList.add('hidden');
        authName.removeAttribute('required');
        authSubmitBtn.textContent = 'Sign In';
        toggleAuthMode.textContent = 'Need an account? Register here.';
    } else {
        authName.classList.remove('hidden');
        authName.setAttribute('required', 'true');
        authSubmitBtn.textContent = 'Register';
        toggleAuthMode.textContent = 'Already have an account? Sign in.';
    }
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = authEmail.value;
    const password = authPassword.value;
    const name = authName.value;

    try {
        if (isLoginMode) {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });
            currentUser = userCredential.user;
        }
    } catch (error) {
        alert(error.message);
    }
});

googleSignInBtn.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (error) {
        alert(error.message);
    }
});

profileBtn.addEventListener('click', () => {
    profileDropdown.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
    if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
        profileDropdown.classList.add('hidden');
    }
});

btnOpenProfilePage.addEventListener('click', () => {
    profileDropdown.classList.add('hidden');
    dashboardUI.classList.add('hidden');
    profileUI.classList.remove('hidden');
});

btnBackToDash.addEventListener('click', () => {
    profileUI.classList.add('hidden');
    dashboardUI.classList.remove('hidden');
    dashboardUI.classList.add('grid');
});

btnSignOut.addEventListener('click', async () => {
    profileDropdown.classList.add('hidden');
    await signOut(auth);
});

btnUpdateName.addEventListener('click', async () => {
    if (currentUser && updateNameInput.value.trim() !== '') {
        try {
            await updateProfile(currentUser, { displayName: updateNameInput.value.trim() });
            navProfilePic.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(updateNameInput.value.trim())}&background=3b82f6&color=fff`;
            alert('Profile name updated successfully.');
        } catch (error) {
            alert(error.message);
        }
    }
});

btnUpdatePassword.addEventListener('click', async () => {
    if (currentUser && updatePasswordInput.value.trim() !== '') {
        try {
            await updatePassword(currentUser, updatePasswordInput.value.trim());
            alert('Password updated successfully.');
            updatePasswordInput.value = '';
        } catch (error) {
            alert(error.message);
        }
    }
});

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

const renderTable = (data) => {
    statementsList.innerHTML = '';
    
    data.forEach(item => {
        const tr = document.createElement('tr');
        const typeColor = item.type === 'income' ? 'text-green-500' : 'text-red-500';
        const sign = item.type === 'income' ? '+' : '-';
        
        let detailsHtml = `<div class="font-medium capitalize text-gray-900 dark:text-gray-100">${item.method}</div>
                           <div class="text-xs text-gray-500 mt-1">${item.reason || 'No reason'}</div>`;
        
        if (item.proof) {
            detailsHtml += `<a href="${item.proof}" target="_blank" class="text-xs text-primary hover:underline mt-1 block"><i class="fa-solid fa-link"></i> View Proof</a>`;
        }

        tr.innerHTML = `
            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">${item.date}</td>
            <td class="px-3 py-4 text-sm">${detailsHtml}</td>
            <td class="px-3 py-4 whitespace-nowrap text-sm text-right font-bold ${typeColor}">
                ${sign} ${formatCurrency(item.amount)}
            </td>
            <td class="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="window.handleDelete('${item.id}')" class="text-red-500 hover:text-red-700 transition">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;
        statementsList.appendChild(tr);
    });
};

const loadData = async () => {
    if (!currentUser) return;
    
    try {
        const q = query(collection(db, "statements"), where("userId", "==", currentUser.uid), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        let data = [];
        
        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });

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
    } catch (error) {
        console.error(error);
    }
};

window.handleDelete = async (id) => {
    if (confirm('Delete this statement?')) {
        try {
            await deleteDoc(doc(db, "statements", id));
            loadData();
        } catch (error) {
            alert(error.message);
        }
    }
};

transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const statement = {
        userId: currentUser.uid,
        type: txType.value,
        amount: parseFloat(txAmount.value),
        method: txMethod.value,
        date: txDate.value,
        reason: txReason.value,
        proof: txProof.value,
        timestamp: new Date().getTime()
    };
    
    try {
        await addDoc(collection(db, "statements"), statement);
        transactionForm.reset();
        txDate.valueAsDate = new Date();
        loadData();
    } catch (error) {
        alert(error.message);
    }
});

btnApplyFilter.addEventListener('click', loadData);

btnGeneratePDF.addEventListener('click', async () => {
    if (!currentUser) return;

    try {
        const q = query(collection(db, "statements"), where("userId", "==", currentUser.uid), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        let data = [];
        querySnapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));

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

        const { jsPDF } = window.jspdf;
        const docObj = new jsPDF();
        
        docObj.setFontSize(22);
        docObj.setTextColor(15, 23, 42);
        docObj.text('VaultFlow Account Statement', 14, 22);
        
        docObj.setFontSize(10);
        docObj.setTextColor(100, 116, 139);
        docObj.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
        docObj.text(`Account: ${currentUser.displayName || currentUser.email}`, 14, 36);
        
        docObj.setDrawColor(226, 232, 240);
        docObj.line(14, 42, 196, 42);
        
        docObj.setFontSize(11);
        docObj.setTextColor(34, 197, 94);
        docObj.text(`Total Income: +${formatCurrency(income)}`, 14, 50);
        docObj.setTextColor(239, 68, 68);
        docObj.text(`Total Expense: -${formatCurrency(expense)}`, 75, 50);
        docObj.setFont(undefined, 'bold');
        docObj.setTextColor(15, 23, 42);
        docObj.text(`Closing Balance: ${formatCurrency(balance)}`, 140, 50);
        
        const tableData = data.map(item => [
            item.date,
            item.method.charAt(0).toUpperCase() + item.method.slice(1),
            item.reason || '-',
            item.type === 'income' ? '(+)' : '(-)',
            formatCurrency(item.amount)
        ]);
        
        docObj.autoTable({
            startY: 58,
            head: [['Date', 'Method', 'Reason', 'Type', 'Amount']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
            didParseCell: function(data) {
                if (data.section === 'body' && (data.column.index === 3 || data.column.index === 4)) {
                    if (data.row.raw[3] === '(+)') {
                        data.cell.styles.textColor = [34, 197, 94];
                    } else {
                        data.cell.styles.textColor = [239, 68, 68];
                    }
                }
            }
        });
        
        docObj.save(`VaultFlow_Statement_${new Date().getTime()}.pdf`);
    } catch (error) {
        alert(error.message);
    }
});
