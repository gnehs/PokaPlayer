import{_ as c,j as u,r as i,o as m,c as _,b as a,x as g,f as n,w as b,m as f,t as w,p as h,g as v}from"./index-dca75ef4.js";const y="/img/icon.svg";const V={name:"LoginDialog",setup(){return{socket:u("socket")}},data(){return{username:localStorage.getItem("username")||"",password:localStorage.getItem("password")||""}},methods:{async login(){(await this.$PokaAPI.login(this.username,this.password)).success&&this.$router.push("/")}}},p=e=>(h("data-v-883b7654"),e=e(),v(),e),k={class:"login-container"},I={class:"login-form"},S=p(()=>a("img",{class:"logo",src:y,alt:"logo"},null,-1)),x=p(()=>a("h1",null,"PokaPlayer",-1));function P(e,o,B,L,t,l){const r=i("p-input"),d=i("p-btn");return m(),_("div",k,[a("div",I,[S,x,a("form",{onSubmit:o[2]||(o[2]=g((...s)=>l.login&&l.login(...s),["prevent"]))},[n(r,{label:e.$t("username"),modelValue:t.username,"onUpdate:modelValue":o[0]||(o[0]=s=>t.username=s),required:""},null,8,["label","modelValue"]),n(r,{label:e.$t("password"),modelValue:t.password,"onUpdate:modelValue":o[1]||(o[1]=s=>t.password=s),type:"password",required:""},null,8,["label","modelValue"]),n(d,{type:"submit",block:"",style:{"margin-top":"calc(var(--padding) * 2)"},color:"primary"},{default:b(()=>[f(w(e.$t("login")),1)]),_:1})],32)])])}const $=c(V,[["render",P],["__scopeId","data-v-883b7654"]]);export{$ as default};
