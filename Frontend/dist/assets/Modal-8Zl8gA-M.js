import{c as s,j as e,A as o,m as i}from"./index-BgoAkrL-.js";/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=s("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const r=s("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]),x={hidden:{opacity:0},visible:{opacity:1}},m={hidden:{opacity:0,scale:.95,y:10},visible:{opacity:1,scale:1,y:0,transition:{type:"spring",damping:25,stiffness:350}},exit:{opacity:0,scale:.97,y:5,transition:{duration:.15}}};function y({isOpen:t,onClose:a,title:n,children:c,size:l="md"}){const d={sm:"max-w-md",md:"max-w-lg",lg:"max-w-2xl",xl:"max-w-4xl"};return e.jsx(o,{children:t&&e.jsxs(i.div,{className:"fixed inset-0 z-50 flex items-center justify-center p-4",variants:x,initial:"hidden",animate:"visible",exit:"hidden",children:[e.jsx(i.div,{className:"fixed inset-0 bg-black/30 backdrop-blur-sm",onClick:a,initial:{opacity:0},animate:{opacity:1},exit:{opacity:0}}),e.jsxs(i.div,{className:`relative bg-white rounded-2xl shadow-modal w-full ${d[l]} max-h-[90vh] overflow-hidden`,variants:m,initial:"hidden",animate:"visible",exit:"exit",children:[e.jsxs("div",{className:"flex items-center justify-between px-6 py-4 border-b border-surface-100",children:[e.jsx("h2",{className:"text-lg font-semibold text-surface-900",children:n}),e.jsx("button",{onClick:a,className:"p-1.5 rounded-lg hover:bg-surface-100 transition-colors text-surface-400 hover:text-surface-600",children:e.jsx(r,{size:18})})]}),e.jsx("div",{className:"px-6 py-5 overflow-y-auto max-h-[calc(90vh-80px)]",children:c})]})]})})}export{y as M,p as P,r as X};
