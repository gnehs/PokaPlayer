import{y as V,z as k,r as a,o as u,c as r,e as q,b as i,t as _,T as B,f as t,w as s,q as c,A as L,F as m,d as S,s as C}from"./index-55e28da3.js";import{u as I}from"./user-8fc11de1.js";const N={class:"setting-item"},T={class:"content"},w={class:"title"},z=i("div",{class:"description"},null,-1),F={class:"control"},R=["value"],U=i("i",{class:"bx bx-music"},null,-1),A=i("i",{class:"bx bx-brush-alt"},null,-1),D=i("i",{class:"bx bx-pin"},null,-1),E=i("i",{class:"bx bx-user"},null,-1),M=i("i",{class:"bx bx-server"},null,-1),j=i("i",{class:"bx bx-group"},null,-1),G=i("i",{class:"bx bx-file"},null,-1),O={__name:"Index",setup(H){const{locale:p,availableLocales:b,getLocaleMessage:f}=V({inheritLocale:!0,useScope:"global"}),h=I(),{userInfo:$}=k(h);return(e,g)=>{const v=a("p-select"),n=a("p-list-item-icon-btn"),l=a("p-list-item-content"),o=a("p-list-item"),x=a("p-list-items");return u(),r(m,null,[(u(),q(B,{to:"#header-center"},[i("p",null,_(e.$t("nav.settings")),1)])),i("div",N,[i("div",T,[i("div",w,_(e.$t("language")),1),z]),i("div",F,[t(v,{modelValue:c(p),"onUpdate:modelValue":g[0]||(g[0]=d=>L(p)?p.value=d:null)},{default:s(()=>[(u(!0),r(m,null,S(c(b),d=>(u(),r("option",{value:d},_(c(f)(d).language_name({normalize:y=>y[0]})),9,R))),256))]),_:1},8,["modelValue"])])]),i("div",null,[t(x,null,{default:s(()=>[t(o,{to:"/settings/quality",tabindex:"0"},{default:s(()=>[t(n,null,{default:s(()=>[U]),_:1}),t(l,{title:e.$t("settings.quality.title"),description:e.$t("settings.quality.description")},null,8,["title","description"])]),_:1}),t(o,{to:"/settings/theme",tabindex:"0"},{default:s(()=>[t(n,null,{default:s(()=>[A]),_:1}),t(l,{title:e.$t("settings.theme.title"),description:e.$t("settings.theme.description")},null,8,["title","description"])]),_:1}),t(o,{to:"/settings/pins",tabindex:"0"},{default:s(()=>[t(n,null,{default:s(()=>[D]),_:1}),t(l,{title:e.$t("settings.pins.title"),description:e.$t("settings.pins.description")},null,8,["title","description"])]),_:1}),t(o,{to:"/settings/user",tabindex:"0"},{default:s(()=>[t(n,null,{default:s(()=>[E]),_:1}),t(l,{title:e.$t("settings.user.title"),description:e.$t("settings.user.description")},null,8,["title","description"])]),_:1}),c($).role==="admin"?(u(),r(m,{key:0},[t(o,{to:"/settings/system",tabindex:"0"},{default:s(()=>[t(n,null,{default:s(()=>[M]),_:1}),t(l,{title:e.$t("settings.system.title"),description:e.$t("settings.system.description")},null,8,["title","description"])]),_:1}),t(o,{to:"/settings/users",tabindex:"0"},{default:s(()=>[t(n,null,{default:s(()=>[j]),_:1}),t(l,{title:e.$t("settings.users.title"),description:e.$t("settings.users.description")},null,8,["title","description"])]),_:1}),t(o,{to:"/settings/log",tabindex:"0"},{default:s(()=>[t(n,null,{default:s(()=>[G]),_:1}),t(l,{title:e.$t("settings.log.title"),description:e.$t("settings.log.description")},null,8,["title","description"])]),_:1})],64)):C("",!0)]),_:1})])],64)}}};export{O as default};