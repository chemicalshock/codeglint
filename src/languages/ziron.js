// -------------------------------------------------------------
//
//!\file ziron.js
//!\brief Ziron and x86 lexer for Codeglint.
//!\author Colin J.D. Stewart
//
// -------------------------------------------------------------
//
//           Copyright (c) 2026. Colin J.D. Stewart.
//                   All rights reserved
//
// -------------------------------------------------------------

const words = text => new Set(text.trim().split(/\s+/));
const keywords = words(`
  as block break case cdecl class const default delete do downto else elseif entry enum except exports
  finally for function if imports inherit inline msx64 new op ord plugins procedure program repeat return
  sizeof state static stdcall step this to try type until uses while
`);
const types = words(`
  boolean byte char double dword extended int8 int16 int32 int64 pointer ptr qword real4 real8 real10
  sbyte short signed single sysint sysword unsigned widechar word
`);
const constants = words('true false nil null nothing');
const registers = /^(?:[re]?(?:ax|bx|cx|dx|si|di|bp|sp|ip)|[abcd][hl]|[sb]pl|[sd]il|[cdefgs]s|r(?:[89]|1[0-5])[bwd]?|(?:[xyz]mm|mm|st|cr|dr)\d+)$/;
const instructions = words(`
  aaa aad aam aas adc add addpd addps addsd addss addsubpd addsubps and andnpd andnps andpd andps
  bsf bsr bswap bt btc btr bts call cbw cdqe clc cld cli cmc cmova cmovae cmovb cmovbe cmovc cmove
  cmovg cmovge cmovl cmovle cmovna cmovnae cmovnb cmovnbe cmovnc cmovne cmovng cmovnge cmovnl
  cmovnle cmovno cmovnp cmovns cmovnz cmovo cmovp cmovpe cmovpo cmovs cmovz cmp cmpsb cmpsd cmpsw
  cmpxchg comisd comiss cpuid cwde daa das dec div divpd divps divsd divss emms enter f2xm1 fabs
  fadd fchs fclex fcom fcomp fcompp fcos fdecstp fdiv fdivr femms fiadd ficom ficomp fidiv fidivr
  fild fimul fincstp finit fist fistp fisttp fisub fisubr fld fld1 fldl2e fldl2t fldlg2 fldln2
  fldpi fldz fmul fnclex fninit fnop fpatan fprem fprem1 fptan frndint fscale fsin fsincos fsqrt
  fst fstp fsub fsubr ftst fucompp fwait fxam fyl2x fyl2xp1 goto haddpd haddps hlt hsubpd hsubps
  idiv imul inc int int3 ja jae jb jbe jc jcxz je jecxz jg jge jl jle jmp jna jnae jnb jnbe jnc jne
  jng jnge jnl jnle jno jnp jns jnz jo jp jpe jpo js jz lddqu lea leave lfence lock lodsb lodsd
  lodsw loop loope loopne loopnz loopz maxpd maxps maxsd maxss mfence minpd minps minsd minss
  monitor mov movapd movaps movddup movdq2q movdqa movdqu movhlps movhpd movhps movlhps movlpd
  movlps movmskpd movmskps movntdq movntdqa movnti movntpd movntps movntq movq movq2dq movsb movsd
  movss movsw movsx movupd movups movzx mul mulpd mulps mulsd mulss mwait neg nop not or pabsb
  pabsd pabsw paddb paddd paddq paddsb paddsw paddusb paddusw paddw pand pandn pause pavgb pavgw
  pcmpeqb pcmpeqd pcmpeqq pcmpeqw pcmpgtb pcmpgtd pcmpgtq pcmpgtw phaddsw phaddw phsubd phsubsw
  phsubw pmaddwd pmaxsb pmaxsd pmaxsw pmaxub pmaxud pmaxuw pminsb pminsd pminsw pminub pminud
  pminuw pmuldq pmulhuw pmulhw pmulld pmullw pmuludq pop popad popcnt popf popfd popfq psignb
  psignd psignw pslld pslldq psllq psllw psrad psraw psrld psrldq psrlq psrlw psubb psubd psubq
  psubsb psubsw psubusb psubusw psubw ptest push pushad pushf pushfd pushfq rcl rcr rdmsr rdpmc
  rdtsc rep repe repn repne repnz repz ret retn rol ror rsm sahf sal sar sbb scasb scasd scasw seta
  setae setb setbe setc sete setg setge setl setle setna setnae setnb setnbe setnc setne setng
  setnge setnl setnle setno setnp setns setnz seto setp setpe setpo sets setz sfence shl shld shr
  shrd sqrtpd sqrtps sqrtsd sqrtss stc std sti stosb stosd stosw sub subpd subps subsd subss test
  ucomisd ucomiss ud2 xadd xchg xor xorpd xorps
`);
const atom = /(?<string>'(?:\\.|''|[^'\\])*'|"(?:\\.|""|[^"\\])*"|['"][^\n]*)|(?<preprocessor>[#$][A-Za-z_][\w]*)|(?<attribute>@[A-Za-z_][\w]*|[A-Za-z_][\w]*(?=:))|(?<number>0[xX][\da-fA-F]+|0[bB][01]+|\d[\da-fA-F]*[hH]\b|[01]+[bB]\b|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(?<word>[A-Za-z_][\w]*)|(?<operator>[+*/%=<>!&|?^~\-])|(?<punctuation>[{}\[\](),.;:])/y;

function wordType(word) {
  const text = word.toLowerCase();
  if (keywords.has(text)) return 'keyword';
  if (types.has(text)) return 'type';
  if (constants.has(text) || registers.test(text)) return 'constant';
  if (instructions.has(text)) return 'function';
  return 'identifier';
}

/**
 * @brief Tokenise a Ziron line, carrying block comments across lines.
 * @param {string} line Source line.
 * @param {boolean} inComment Previous line ended inside a block comment.
 * @returns {Object} Relative tokens and next comment state.
 */
export function tokeniseZironLine(line, inComment = false) {
  const tokens = [];
  let index = 0;
  while (index < line.length) {
    const start = index;
    if (inComment || line.startsWith('/*', index)) {
      const closing = line.indexOf('*/', index + (inComment ? 0 : 2));
      inComment = closing < 0;
      index = inComment ? line.length : closing + 2;
      tokens.push({ type: 'comment', start, end: index });
    } else if (line.startsWith('//', index)) {
      tokens.push({ type: 'comment', start, end: line.length });
      break;
    } else {
      atom.lastIndex = index;
      const match = atom.exec(line);
      if (!match) {
        index++;
        continue;
      }
      index = atom.lastIndex;
      const category = Object.keys(match.groups).find(type => match.groups[type] !== undefined);
      tokens.push({ type: category === 'word' ? wordType(match[0]) : category, start, end: index });
    }
  }
  return { tokens, state: inComment };
}

export const ziron = {
  id: 'ziron',
  name: 'Ziron',
  aliases: ['zir'],
  initialState: () => false,
  tokeniseLine: tokeniseZironLine
};

export default ziron;
