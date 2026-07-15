const STORAGE_KEY = "tcp_v2";

const defaultData = {
  users: [], // {email, password, name}
  currentUser: null,
  subscription: "free",
  groups: []
};

export const DB = {
  get() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : defaultData;
  },
  save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
  signup(name, email, password) {
    const data = this.get();
    if(data.users.find(u=>u.email===email)) return {error: "Email already exists"};
    data.users.push({name, email, password});
    data.currentUser = email;
    this.save(data);
    return {success: true};
  },
  login(email, password) {
    const data = this.get();
    const user = data.users.find(u=>u.email===email && u.password===password);
    if(!user) return {error: "Invalid login"};
    data.currentUser = email;
    this.save(data);
    return {success: true};
  },
  logout() {
    const data = this.get();
    data.currentUser = null;
    this.save(data);
  },
  getPlan() { return this.get().subscription; },
  setPlan(plan) { const d=this.get(); d.subscription=plan; this.save(d); }
};

export const PLANS = {
  free: { name: "Free", price: 0, groupLimit: 2, memberLimit: 20, ads: true },
  pro: { name: "Pro", price: 350000, priceDisplay: "₦3,500/mo", groupLimit: -1, memberLimit: -1, ads: false }
};

export const genReceiptId = () => `TCP-${new Date().getFullYear()}-${Math.floor(Math.random()*90000+10000)}`;
export const now = () => new Date().toLocaleString("en-NG", {dateStyle:"medium", timeStyle:"short"});

function payWithPaystack(email, onSuccess) {
  let handler = PaystackPop.setup({
    key: "pk_test_your_key_here", // CHANGE TO LIVE KEY
    email: email,
    amount: PLANS.pro.price,
    currency: "NGN",
    ref: `TCP_${Date.now()}`,
    callback: function(response){
      DB.setPlan("pro");
      alert("Upgrade Successful!");
      location.reload();
    },
    onClose: function(){ alert("Payment cancelled"); }
  });
  handler.openIframe();
      }
