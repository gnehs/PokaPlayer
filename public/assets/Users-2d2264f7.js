import{j,i as g,L as E,k as I,r as d,o as p,c as P,e as c,b as s,t as U,T as D,f as e,w as l,s as L,q as R,A as S,F as $,m as w,d as h}from"./index-d10ff82d.js";const F=s("i",{class:"bx bx-edit"},null,-1),q=s("h3",null,"Create user",-1),M=s("p",null,"Create a new user",-1),z=s("option",{value:"user"},"User",-1),G=s("option",{value:"admin"},"Admin",-1),H={style:{display:"flex","justify-content":"flex-end","margin-top":"var(--padding)",gap:"var(--padding)"}},J=s("i",{class:"bx bx-lock-alt"},null,-1),K=s("i",{class:"bx bx-trash-alt"},null,-1),O={style:{display:"flex","justify-content":"flex-end","margin-top":"var(--padding)"}},Y={__name:"Users",setup(Q){const _=j("PokaAPI"),y=g(null),n=g(null),i=g({name:"",username:"",password:"",role:"user"}),f=E({get:()=>!!n.value,set:()=>n.value=null}),m=g(!1);async function b(){let o=await _.getUserList();y.value=o}async function N(){let o=prompt("New password");if(o){let t=await _.changeUserPasswordById(n.value._id,o);t.success?alert("Password changed"):alert("Error: "+t.error)}}async function T(){prompt("Are you sure you want to delete this user? Type 'yes' to confirm")=="yes"&&((await _.deleteUser(n.value._id)).ok?await b():alert("Error"))}async function A(){let o=await _.createUser(i.value);o.success?(await b(),m.value=!1):alert("Error: "+o.error)}return I(async()=>{await b()}),(o,t)=>{const v=d("p-btn"),u=d("p-list-item-content"),V=d("p-list-item-icon-btn"),r=d("p-list-item"),k=d("p-list-items"),x=d("p-input"),B=d("p-select"),C=d("Dialog");return p(),P($,null,[(p(),c(D,{to:"#header-center"},[s("p",null,U(o.$t("settings.users.title")),1)])),(p(),c(D,{to:"#header-actions"},[e(v,{onClick:t[0]||(t[0]=a=>m.value=!0),outline:""},{default:l(()=>[w("Create")]),_:1})])),y.value?(p(),c(k,{key:0},{default:l(()=>[(p(!0),P($,null,h(y.value,a=>(p(),c(r,{tabindex:0},{actions:l(()=>[s("span",null,U(a.role),1),e(V,{onClick:W=>n.value=a},{default:l(()=>[F]),_:2},1032,["onClick"])]),default:l(()=>[e(u,{title:a.name,description:a.username},null,8,["title","description"])]),_:2},1024))),256))]),_:1})):L("",!0),e(C,{modelValue:m.value,"onUpdate:modelValue":t[6]||(t[6]=a=>m.value=a)},{default:l(()=>[q,M,e(x,{modelValue:i.value.name,"onUpdate:modelValue":t[1]||(t[1]=a=>i.value.name=a),label:"Name"},null,8,["modelValue"]),e(x,{modelValue:i.value.username,"onUpdate:modelValue":t[2]||(t[2]=a=>i.value.username=a),label:"Username"},null,8,["modelValue"]),e(x,{modelValue:i.value.password,"onUpdate:modelValue":t[3]||(t[3]=a=>i.value.password=a),label:"Password",type:"password"},null,8,["modelValue"]),e(B,{modelValue:i.value.role,"onUpdate:modelValue":t[4]||(t[4]=a=>i.value.role=a),label:"Role",style:{"margin-top":"var(--padding)"}},{default:l(()=>[z,G]),_:1},8,["modelValue"]),s("div",H,[e(v,{onClick:t[5]||(t[5]=a=>m.value=!1)},{default:l(()=>[w("Cancel")]),_:1}),e(v,{onClick:A,color:"primary"},{default:l(()=>[w("Create")]),_:1})])]),_:1},8,["modelValue"]),e(C,{modelValue:R(f),"onUpdate:modelValue":t[8]||(t[8]=a=>S(f)?f.value=a:null)},{default:l(()=>[n.value?(p(),c(k,{key:0,"single-row":""},{default:l(()=>[e(r,{tabindex:"0"},{default:l(()=>[e(u,{title:n.value.name,description:n.value.username},null,8,["title","description"])]),_:1}),e(r,{tabindex:"0"},{default:l(()=>[e(u,{title:n.value._id,description:"ID"},null,8,["title"])]),_:1}),e(r,{tabindex:"0"},{default:l(()=>[e(u,{title:n.value.role,description:"Role"},null,8,["title"])]),_:1}),e(r,{tabindex:"0"},{default:l(()=>[e(u,{title:new Date(n.value.createTime).toLocaleString(),description:"Create time"},null,8,["title"])]),_:1}),e(r,{tabindex:"0"},{default:l(()=>[e(u,{title:new Date(n.value.lastLoginTime).toLocaleString(),description:"Last login time"},null,8,["title"])]),_:1}),e(r,{tabindex:"0",onClick:N},{default:l(()=>[e(V,null,{default:l(()=>[J]),_:1}),e(u,{title:o.$t("settings.user.changePassword")},null,8,["title"])]),_:1}),e(r,{tabindex:"0",onClick:T},{default:l(()=>[e(V,null,{default:l(()=>[K]),_:1}),e(u,{title:"Delete user"})]),_:1})]),_:1})):L("",!0),s("div",O,[e(v,{onClick:t[7]||(t[7]=a=>f.value=!1),color:"primary"},{default:l(()=>[w(U(o.$t("close")),1)]),_:1})])]),_:1},8,["modelValue"])],64)}}};export{Y as default};