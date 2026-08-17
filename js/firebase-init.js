import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, updateProfile, updatePassword, sendPasswordResetEmail, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc, doc, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const navProfileSection = document.getElementById('navProfileSection');
const profileBtn = document.getElementById('profileBtn');
const profileDropdown = document.getElementById('profileDropdown');
const navProfilePic = document.getElementById('navProfilePic');
const btnOpenDashboard = document.getElementById('btnOpenDashboard');
const btnOpenProfilePage = document.getElementById('btnOpenProfilePage');
const btnSignOut = document.getElementById('btnSignOut');

const authUI = document.getElementById('authUI');
const dashboardUI = document.getElementById('dashboardUI');
const profileUI = document.getElementById('profileUI');

const authForm = document.getElementById('authForm');
const authName = document.getElementById('authName');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const toggleAuthMode = document.getElementById('toggleAuthMode');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const forgotPasswordContainer = document.getElementById('forgotPasswordContainer');
const btnForgotPassword = document.getElementById('btnForgotPassword');

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

const btnBackToDash = document.getElementById('btnBackToDash');
const updateNameInput = document.getElementById('updateNameInput');
const btnUpdateName = document.getElementById('btnUpdateName');
const updatePasswordInput = document.getElementById('updatePasswordInput');
const btnUpdatePassword = document.getElementById('btnUpdatePassword');

const toastContainer = document.getElementById('toastContainer');
const confirmModal = document.getElementById('confirmModal');
const confirmMessageEl = document.getElementById('confirmMessage');
const btnCancelConfirm = document.getElementById('btnCancelConfirm');
const btnAcceptConfirm = document.getElementById('btnAcceptConfirm');
const confirmBox = document.getElementById('confirmBox');

const bottomInstallBanner = document.getElementById('bottomInstallBanner');
const btnBottomInstall = document.getElementById('btnBottomInstall');

let isLoginMode = true;
let currentUser = null;
let currentConfirmCallback = null;
let initialLoadDone = false;

const isVaultPage = window.location.pathname.includes('vault.html');

if(txDate) txDate.valueAsDate = new Date();
if(document.getElementById('currentYear')) document.getElementById('currentYear').textContent = new Date().getFullYear();

let deferredPrompt;
const installAppBtn = document.getElementById('installAppBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if(installAppBtn) installAppBtn.classList.remove('hidden');
    if(bottomInstallBanner) bottomInstallBanner.classList.remove('hidden');
});

const triggerInstall = async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            deferredPrompt = null;
            if(installAppBtn) installAppBtn.classList.add('hidden');
            if(bottomInstallBanner) bottomInstallBanner.classList.add('hidden');
        }
    }
};

if(installAppBtn) installAppBtn.addEventListener('click', triggerInstall);
if(btnBottomInstall) btnBottomInstall.addEventListener('click', triggerInstall);

const showView = (viewName) => {
    if(authUI) authUI.classList.add('hidden');
    if(dashboardUI) {
        dashboardUI.classList.add('hidden');
        dashboardUI.classList.remove('grid');
    }
    if(profileUI) profileUI.classList.add('hidden');

    if (viewName === 'auth' && authUI) {
        authUI.classList.remove('hidden');
    } else if (viewName === 'dashboard' && dashboardUI) {
        dashboardUI.classList.remove('hidden');
        dashboardUI.classList.add('grid');
        loadData();
    } else if (viewName === 'profile' && profileUI) {
        profileUI.classList.remove('hidden');
    }
};

if(btnOpenDashboard) btnOpenDashboard.addEventListener('click', () => { profileDropdown.classList.add('hidden'); showView('dashboard'); });
if(btnOpenProfilePage) btnOpenProfilePage.addEventListener('click', () => { profileDropdown.classList.add('hidden'); showView('profile'); });
if(btnBackToDash) btnBackToDash.addEventListener('click', () => showView('dashboard'));

const showToast = (message, type = 'error') => {
    if(!toastContainer) return;
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation';
    toast.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 transform transition-all duration-300 translate-y-10 opacity-0 pointer-events-auto`;
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.remove('translate-y-10', 'opacity-0'));
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
};

const showConfirm = (message, callback) => {
    if(!confirmModal) return;
    confirmMessageEl.textContent = message;
    confirmModal.classList.remove('hidden');
    confirmModal.classList.add('flex');
    currentConfirmCallback = callback;
    requestAnimationFrame(() => {
        confirmBox.classList.remove('scale-95');
        confirmBox.classList.add('scale-100');
    });
};

const closeConfirm = () => {
    if(!confirmBox) return;
    confirmBox.classList.remove('scale-100');
    confirmBox.classList.add('scale-95');
    setTimeout(() => {
        confirmModal.classList.add('hidden');
        confirmModal.classList.remove('flex');
        currentConfirmCallback = null;
    }, 150);
};

if(btnCancelConfirm) btnCancelConfirm.addEventListener('click', closeConfirm);
if(btnAcceptConfirm) btnAcceptConfirm.addEventListener('click', () => { if (currentConfirmCallback) currentConfirmCallback(); closeConfirm(); });

const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

const triggerSplash = (name) => {
    if(!splashScreen) return;
    splashScreen.classList.remove('hidden', 'opacity-0');
    splashText.textContent = `Hi, ${name}!`;
    splashText.classList.remove('scale-110', 'opacity-100', 'animate-float');
    splashText.classList.add('scale-95', 'opacity-0');
    
    setTimeout(() => {
        splashText.classList.remove('scale-95', 'opacity-0');
        splashText.classList.add('scale-110', 'opacity-100', 'animate-float');
    }, 100);

    setTimeout(() => {
        splashScreen.classList.add('opacity-0');
        setTimeout(() => {
            splashScreen.classList.add('hidden');
            showView('dashboard');
        }, 1000); 
    }, 3500); 
};

onAuthStateChanged(auth, (user) => {
    if (user && (user.emailVerified || user.providerData.some(p => p.providerId === 'google.com'))) {
        currentUser = user;
        const displayName = user.displayName || 'User';
        
        if(navProfilePic) navProfilePic.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff`;
        if(updateNameInput) updateNameInput.value = displayName;
        
        const navLoginBtn = document.getElementById('navLoginBtn');
        if(navLoginBtn) navLoginBtn.classList.add('hidden');
        if(navProfileSection) navProfileSection.classList.remove('hidden');
        
        if(isVaultPage) {
            if (!initialLoadDone) {
                triggerSplash(displayName);
                initialLoadDone = true;
            } else {
                showView('dashboard');
            }
        }
    } else {
        currentUser = null;
        const navLoginBtn = document.getElementById('navLoginBtn');
        if(navLoginBtn) navLoginBtn.classList.remove('hidden');
        if(navProfileSection) navProfileSection.classList.add('hidden');
        
        if(isVaultPage) {
            if(splashScreen) splashScreen.classList.add('hidden');
            showView('auth');
            initialLoadDone = true;
        }
    }
});

if(toggleAuthMode) {
    toggleAuthMode.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        if (isLoginMode) {
            authName.classList.add('hidden');
            authName.removeAttribute('required');
            forgotPasswordContainer.classList.remove('hidden');
            authSubmitBtn.textContent = 'Sign In';
            toggleAuthMode.textContent = 'Need an account? Register here.';
        } else {
            authName.classList.remove('hidden');
            authName.setAttribute('required', 'true');
            forgotPasswordContainer.classList.add('hidden');
            authSubmitBtn.textContent = 'Register';
            toggleAuthMode.textContent = 'Already have an account? Sign in.';
        }
    });
}

if(authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = authEmail.value.trim();
        const password = authPassword.value;
        const name = authName.value.trim();

        try {
            if (isLoginMode) {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                if (!userCredential.user.emailVerified) {
                    await signOut(auth);
                    showToast('Please verify your email before signing in. Check your inbox.', 'error');
                    return;
                }
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName: name });
                await sendEmailVerification(userCredential.user);
                await signOut(auth); 
                
                showToast('Registration successful! Check your email to verify your account.', 'success');
                
                isLoginMode = true;
                authName.classList.add('hidden');
                authName.removeAttribute('required');
                forgotPasswordContainer.classList.remove('hidden');
                authSubmitBtn.textContent = 'Sign In';
                toggleAuthMode.textContent = 'Need an account? Register here.';
                authForm.reset();
            }
        } catch (error) {
            showToast(error.message.replace('Firebase: ', ''), 'error');
        }
    });
}

if(btnForgotPassword) {
    btnForgotPassword.addEventListener('click', async () => {
        const email = authEmail.value.trim();
        if (!email) {
            showToast('Please enter your email address first.', 'error');
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            showToast('Password reset link sent! Check your inbox.', 'success');
        } catch (error) {
            showToast(error.message.replace('Firebase: ', ''), 'error');
        }
    });
}

if(googleSignInBtn) {
    googleSignInBtn.addEventListener('click', async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            showToast(error.message.replace('Firebase: ', ''), 'error');
        }
    });
}

if(profileBtn) {
    profileBtn.addEventListener('click', () => profileDropdown.classList.toggle('hidden'));
    document.addEventListener('click', (e) => {
        if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.add('hidden');
        }
    });
}

if(btnSignOut) {
    btnSignOut.addEventListener('click', async () => {
        profileDropdown.classList.add('hidden');
        await signOut(auth);
        if(isVaultPage) window.location.href = '/';
    });
}

if(btnUpdateName) {
    btnUpdateName.addEventListener('click', async () => {
        if (currentUser && updateNameInput.value.trim() !== '') {
            try {
                await updateProfile(currentUser, { displayName: updateNameInput.value.trim() });
                navProfilePic.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(updateNameInput.value.trim())}&background=3b82f6&color=fff`;
                showToast('Profile name updated successfully!', 'success');
            } catch (error) {
                showToast(error.message.replace('Firebase: ', ''), 'error');
            }
        }
    });
}

if(btnUpdatePassword) {
    btnUpdatePassword.addEventListener('click', async () => {
        if (currentUser && updatePasswordInput.value.trim() !== '') {
            try {
                await updatePassword(currentUser, updatePasswordInput.value.trim());
                showToast('Password updated successfully!', 'success');
                updatePasswordInput.value = '';
            } catch (error) {
                showToast(error.message.replace('Firebase: ', ''), 'error');
            }
        }
    });
}

if(btnExpense) {
    btnExpense.addEventListener('click', () => {
        txType.value = 'expense';
        btnExpense.className = 'w-full py-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg font-medium border-2 border-red-500 transition-all';
        btnIncome.className = 'w-full py-2 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-lg font-medium border-2 border-transparent transition-all';
    });
}

if(btnIncome) {
    btnIncome.addEventListener('click', () => {
        txType.value = 'income';
        btnIncome.className = 'w-full py-2 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-lg font-medium border-2 border-green-500 transition-all';
        btnExpense.className = 'w-full py-2 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-lg font-medium border-2 border-transparent transition-all';
    });
}

const renderTable = (data) => {
    if(!statementsList) return;
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
    if (!currentUser || !dashboardUI) return;
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
        
        let income = 0; let expense = 0;
        data.forEach(item => item.type === 'income' ? income += parseFloat(item.amount) : expense += parseFloat(item.amount));
        
        totalIncomeEl.textContent = formatCurrency(income);
        totalExpenseEl.textContent = formatCurrency(expense);
        totalBalanceEl.textContent = formatCurrency(income - expense);
        renderTable(data);
    } catch (error) {
        showToast('Error loading data: ' + error.message, 'error');
    }
};

window.handleDelete = (id) => {
    showConfirm('Are you sure you want to delete this statement? This cannot be undone.', async () => {
        try {
            await deleteDoc(doc(db, "statements", id));
            loadData();
            showToast('Statement deleted successfully.', 'success');
        } catch (error) {
            showToast('Error deleting statement.', 'error');
        }
    });
};

if(transactionForm) {
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
            showToast('Statement added successfully!', 'success');
        } catch (error) {
            showToast(error.message.replace('Firebase: ', ''), 'error');
        }
    });
}

if(btnApplyFilter) btnApplyFilter.addEventListener('click', loadData);

if(btnGeneratePDF) {
    btnGeneratePDF.addEventListener('click', async () => {
        if (!currentUser) return;
        try {
            const q = query(collection(db, "statements"), where("userId", "==", currentUser.uid), orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);
            let data = [];
            querySnapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));

            const sDate = filterStart.value; const eDate = filterEnd.value; const method = filterMethod.value;
            if (sDate) data = data.filter(d => d.date >= sDate);
            if (eDate) data = data.filter(d => d.date <= eDate);
            if (method !== 'all') data = data.filter(d => d.method === method);

            if (data.length === 0) { showToast('No statements found for the selected filters.', 'error'); return; }

            let income = 0; let expense = 0;
            data.forEach(item => item.type === 'income' ? income += parseFloat(item.amount) : expense += parseFloat(item.amount));
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
                item.date, item.method.charAt(0).toUpperCase() + item.method.slice(1), item.reason || '-',
                item.type === 'income' ? '(+)' : '(-)', formatCurrency(item.amount)
            ]);
            
            docObj.autoTable({
                startY: 58,
                head: [['Date', 'Method', 'Reason', 'Type', 'Amount']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [59, 130, 246] },
                didParseCell: function(data) {
                    if (data.section === 'body' && (data.column.index === 3 || data.column.index === 4)) {
                        data.cell.styles.textColor = data.row.raw[3] === '(+)' ? [34, 197, 94] : [239, 68, 68];
                    }
                }
            });
            docObj.save(`VaultFlow_Statement_${new Date().getTime()}.pdf`);
            showToast('PDF Exported Successfully!', 'success');
        } catch (error) {
            showToast('Failed to generate PDF.', 'error');
        }
    });
}
