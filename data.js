const STORAGE_KEY = "thrifttrack_v3_multi";

export const CURRENCIES = {
  USD: { symbol: "$", name: "US Dollar", locale: "en-US" },
  EUR: { symbol: "€", name: "Euro", locale: "de-DE" },
  GBP: { symbol: "£", name: "British Pound", locale: "en-GB" },
  NGN: { symbol: "₦", name: "Nigerian Naira", locale: "en-NG" },
  GHS: { symbol: "GH₵", name: "Ghana Cedi", locale: "en-GH" },
  KES: { symbol: "KSh", name: "Kenyan Shilling", locale: "en-KE" },
  ZAR: { symbol: "R", name: "South African Rand", locale: "en-ZA" },
  INR: { symbol: "₹", name: "Indian Rupee", locale: "en-IN" },
  CAD: { symbol: "C$", name: "Canadian Dollar", locale: "en-CA" },
  AUD: { symbol: "A$", name: "Australian Dollar", locale: "en-AU" }
};

export const LIMITS = {
  free: { name: "Free", groupLimit: 5, memberLimit: 100, ads: true, features:["5 Groups","Basic Export","Ads Supported"] },
  pro: { name: "Pro", groupLimit: -1, memberLimit: -1, ads: false, features:["Unlimited Groups","No Ads","WhatsApp Broadcast","PDF Reports","Priority Support"] }
};

export const DB = {
  get() { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {users:[],currentUser:null,isPro:false,currency:"USD",groups:[]}; },
  save(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); },
  signup(name,email,password,currency){ let d=this.get(); if(d.users.find(u=>u.email===email)) return {error:"Email already registered"}; d.users.push({id:Date.now(),name,email,password}); d.currentUser=email; d.currency=currency; this.save(d); return {success:true}; },
  login(email,password){ let d=this.get(); let u=d.users.find(u=>u.email===email && u.password===password); if(!u) return {error:"Invalid email or password"}; d.currentUser=email; this.save(d); return {success:true}; },
  logout(){ let d=this.get(); d.currentUser=null; this.save(d); },
  getUser(){ return this.get().users.find(u=>u.email===this.get().currentUser) },
  getCurrency(){ return this.get().currency; },
  isPro(){ return this.get().isPro; },
  setPro(status){ let d=this.get(); d.isPro=status; this.save(d); },
  formatAmount(amount){
    const code = this.getCurrency();
    const config = CURRENCIES[code] || CURRENCIES.USD;
    return new Intl.NumberFormat(config.locale, { style: 'currency', currency: code, minimumFractionDigits: 0 }).format(amount);
  },
  addGroup(name,amount){ let d=this.get(); if(!this.isPro() && d.groups.length>=LIMITS.free.groupLimit) return {error:"Free limit: 5 groups. Upgrade to Pro"}; d.groups.push({id:Date.now(),name,amount:Number(amount),freq:"Weekly",created:now(),members:[]}); this.save(d); return {success:true}; },
  addMember(groupId,name,phone){ let d=this.get(); let g=d.groups.find(g=>g.id===groupId); if(!g) return {error:"Group not found"}; if(!this.isPro() && g.members.length>=LIMITS.free.memberLimit) return {error:"Free limit: 100 members"}; g.members.push({id:Date.now(),name,phone,records:[]}); this.save(d); return {success:true}; },
  addRecord(groupId,memberId,note){ let d=this.get(); let g=d.groups.find(g=>g.id===groupId); let m=g.members.find(m=>m.id===memberId); m.records.push({id:genId(),note,date:now()}); this.save(d); }
};

export const genId = () => `TT-${new Date().getFullYear()}-${Math.floor(Math.random()*90000+10000)}`;
export const now = () => new Date().toLocaleDateString();
