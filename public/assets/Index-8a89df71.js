import{y as V,z as k,r as a,o as u,c as r,e as B,b as i,t as _,T as L,f as t,w as s,q as c,A as S,F as m,d as C,s as I}from"./index-d10ff82d.js";import{u as N}from"./user-0ade28ac.js";const T={class:"setting-item"},w={class:"content"},z={class:"title"},F=i("div",{class:"description"},null,-1),R={class:"control"},U=["value"],q=i("i",{class:"bx bx-brush-alt"},null,-1),A=i("i",{class:"bx bx-pin"},null,-1),D=i("i",{class:"bx bx-user"},null,-1),E=i("i",{class:"bx bx-server"},null,-1),M=i("i",{class:"bx bx-group"},null,-1),j=i("i",{class:"bx bx-file"},null,-1),K={__name:"Index",setup(G){const{locale:p,availableLocales:b,getLocaleMessage:f}=V({inheritLocale:!0,useScope:"global"}),h=N(),{userInfo:$}=k(h);return(e,g)=>{const v=a("p-select"),n=a("p-list-item-icon-btn"),l=a("p-list-item-content"),o=a("p-list-item"),x=a("p-list-items");return u(),r(m,null,[(u(),B(L,{to:"#header-center"},[i("p",null,_(e.$t("nav.settings")),1)])),i("div",T,[i("div",w,[i("div",z,_(e.$t("language")),1),F]),i("div",R,[t(v,{modelValue:c(p),"onUpdate:modelValue":g[0]||(g[0]=d=>S(p)?p.value=d:null)},{default:s(()=>[(u(!0),r(m,null,C(c(b),d=>(u(),r("option",{value:d},_(c(f)(d).language_name({normalize:y=>y[0]})),9,U))),256))]),_:1},8,["modelValue"])])]),i("div",null,[t(x,null,{default:s(()=>[t(o,{to:"/settings/theme",tabindex:"0"},{default:s(()=>[t(n,null,{default:s(()=>[q]),_:1}),t(l,{title:e.$t("settings.theme.title"),description:e.$t("settings.theme.description")},null,8,["title","description"])]),_:1}),t(o,{to:"/settings/pins",tabindex:"0"},{default:s(()=>[t(n,null,{default:s(()=>[A]),_:1}),t(l,{title:e.$t("settings.pins.title"),description:e.$t("settings.pins.description")},null,8,["title","description"])]),_:1}),t(o,{to:"/settings/user",tabindex:"0"},{default:s(()=>[t(n,null,{default:s(()=>[D]),_:1}),t(l,{title:e.$t("settings.user.title"),description:e.$t("settings.user.description")},null,8,["title","description"])]),_:1}),c($).role==="admin"?(u(),r(m,{key:0},[t(o,{to:"/settings/system",tabindex:"0"},{default:s(()=>[t(n,null,{default:s(()=>[E]),_:1}),t(l,{title:e.$t("settings.system.title"),description:e.$t("settings.system.description")},null,8,["title","description"])]),_:1}),t(o,{to:"/settings/users",tabindex:"0"},{default:s(()=>[t(n,null,{default:s(()=>[M]),_:1}),t(l,{title:e.$t("settings.users.title"),description:e.$t("settings.users.description")},null,8,["title","description"])]),_:1}),t(o,{to:"/settings/log",tabindex:"0"},{default:s(()=>[t(n,null,{default:s(()=>[j]),_:1}),t(l,{title:e.$t("settings.log.title"),description:e.$t("settings.log.description")},null,8,["title","description"])]),_:1})],64)):I("",!0)]),_:1})])],64)}}};export{K as default};