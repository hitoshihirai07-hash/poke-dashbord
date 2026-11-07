import {Generations,Pokemon,Move,Field,calculate,toID} from './vendor-calc.mjs';
import {validPoints} from './core.mjs';
const gen=Generations.get(0);
const natures={'さみしがり':'Lonely','いじっぱり':'Adamant','やんちゃ':'Naughty','ゆうかん':'Brave','ずぶとい':'Bold','わんぱく':'Impish','のうてんき':'Lax','のんき':'Relaxed','ひかえめ':'Modest','おっとり':'Mild','うっかりや':'Rash','れいせい':'Quiet','おだやか':'Calm','おとなしい':'Gentle','しんちょう':'Careful','なまいき':'Sassy','おくびょう':'Timid','せっかち':'Hasty','ようき':'Jolly','むじゃき':'Naive','まじめ':'Serious'};
const types={'ノーマル':'Normal','ほのお':'Fire','みず':'Water','でんき':'Electric','くさ':'Grass','こおり':'Ice','かくとう':'Fighting','どく':'Poison','じめん':'Ground','ひこう':'Flying','エスパー':'Psychic','むし':'Bug','いわ':'Rock','ゴースト':'Ghost','ドラゴン':'Dragon','あく':'Dark','はがね':'Steel','フェアリー':'Fairy'};
function translate(value,dict,collection,label){if(value==='なし')return undefined;if(!value)throw Error(label+'を指定してください（効果なしは「なし」）。');const name=dict[value];if(!name||!collection.get(toID(name)))throw Error(label+'「'+value+'」は計算エンジンに未対応です。');return name}
function pokemon(p,row,names){
 const name=names.species[p.species], s=name&&gen.species.get(toID(name));if(!s||!row)throw Error('「'+p.species+'」の計算用データがありません。');
 const keys=['hp','atk','def','spa','spd','spe'],cols=['HP','攻撃','防御','特攻','特防','素早'];if(!keys.every((k,i)=>s.baseStats[k]===Number(row[cols[i]]))||[...s.types].sort().join('|')!==[types[row['タイプ1']],types[row['タイプ2']]].filter(Boolean).sort().join('|'))throw Error(p.species+'のCSVと計算エンジンの種族値・タイプが一致しません。');
 if(!validPoints(p.points))throw Error('能力ポイントが不正です。');if(!natures[p.nature])throw Error('能力補正を選択してください。');
 const ability=translate(p.ability,names.abilities,gen.abilities,'特性'),item=p.item?.trim()?translate(p.item.trim(),names.items,gen.items,'持ち物'):undefined;
 const result=new Pokemon(gen,name,{nature:natures[p.nature],ability:ability||'No Ability',item,evs:Object.fromEntries(keys.map((k,i)=>[k,p.points[i]])),status:p.status||'',boosts:p.boosts||{},curHP:p.curHP||undefined,abilityOn:!!p.abilityOn});
 if(p.curHP&&(!Number.isInteger(p.curHP)||p.curHP<1||p.curHP>result.maxHP()))throw Error(p.species+'の現在HPは1〜'+result.maxHP()+'で指定してください。');
 return result;
}
export function calculateExact({attacker,defender,attackerRow,defenderRow,move,names,conditions={}}){
 const a=pokemon(attacker,attackerRow,names),d=pokemon(defender,defenderRow,names),name=names.moves[move], moveData=name&&gen.moves.get(toID(name));if(!moveData)throw Error('技「'+move+'」は計算エンジンに未対応です。');
 const hits=conditions.hits||1,mh=moveData.multihit;if(Array.isArray(mh)&&(hits<mh[0]||hits>mh[1]))throw Error('この連続技は攻撃回数を'+mh[0]+'〜'+mh[1]+'回に設定してください。');if(typeof mh==='number'&&!moveData.multiaccuracy&&hits!==mh)throw Error('この技の攻撃回数を'+mh+'回に設定してください。');if(!mh&&hits!==1)throw Error('この技の攻撃回数は1回です。');
 const m=new Move(gen,name,{isCrit:!!conditions.critical,hits:conditions.hits||undefined});if(m.category==='Status')throw Error('変化技はダメージを計算できません。');
 const zeroPowerSupported=new Set(['Electro Ball','Final Gambit','Flail','Fling','Grass Knot','Gyro Ball','Hard Press','Heat Crash','Heavy Slam','Low Kick','Night Shade','Reversal','Seismic Toss']);
 const unavailableConditions=new Set(['Payback','Assurance','Lash Out','Rage Fist','Last Respects','Pursuit']);
 if(unavailableConditions.has(name)||(moveData.basePower===0&&!zeroPowerSupported.has(name)))throw Error('この技に必要な対戦中の条件はまだ設定できないため、計算を表示できません。');
 if(a.ability==='Rivalry')throw Error('とうそうしんの計算に必要な性別の設定は未対応です。');
 if(a.ability==='Trace'||d.ability==='Trace')throw Error('トレースでコピーした後の特性を入力してください。');
 if(['Low Kick','Grass Knot','Heavy Slam','Heat Crash'].includes(name)){for(const [p,row] of [[a,attackerRow],[d,defenderRow]])if(Number(row['おもさ'])!==p.weightkg)throw Error('CSVと計算エンジンの重さが一致しないため、この技を計算できません。');}
 const field=new Field({gameType:'Singles',weather:conditions.weather||undefined,terrain:conditions.terrain||undefined,isGravity:!!conditions.gravity,defenderSide:{isReflect:!!conditions.reflect,isLightScreen:!!conditions.lightScreen,isAuroraVeil:!!conditions.auroraVeil,isSwitching:conditions.switching?'out':undefined}});
 const result=calculate(gen,a,d,m,field),range=result.range();return {range,rolls:Array.isArray(result.damage)&&typeof result.damage[0]==='number'?result.damage:null,hp:d.maxHP(),description:range[1]===0?'ダメージなし':result.desc()};
}
