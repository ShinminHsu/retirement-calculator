import { ReactNode } from "react";

// Plain-language teaching content explaining how the calculator works and the
// concepts behind it. Mirrors the discussion that shaped the tool.
export function TutorialTab() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <Intro />

      <Section n={1} title="退休到底是什麼意思？">
        <P>
          退休的財務定義是：<B>你的資產（加上被動收入）能永久支應生活開銷，不必再靠工作收入。</B>
          整件事分兩階段：
        </P>
        <UL>
          <li><B>累積期</B>：還在工作，一邊存錢、一邊讓資產複利成長，直到達到目標數字。</li>
          <li><B>提領期</B>：退休後靠這筆錢每年提領生活費，重點是「不能在過世前先花光」。</li>
        </UL>
        <P>工具要回答的就是：我什麼時候、存到多少，可以從第一階段切到第二階段。</P>
      </Section>

      <Section n={2} title="4% 法則與「退休數字」">
        <P>
          這是整個 FIRE 觀念的地基。結論是：<B>每年提領退休資產的 4%（之後隨通膨調整），這筆錢有很高機率撐 30 年以上不會花光。</B>
          反過來推就得到那個有名的公式：
        </P>
        <Formula>退休目標 = 年支出 × 25</Formula>
        <P>
          那個 25 就是 <Code>1 ÷ 4%</Code>。例如一年花 60 萬，目標 = 60 萬 × 25 ={" "}
          <B>1,500 萬</B>。所以最關鍵的輸入其實是「<B>退休後一年要花多少</B>」，不是「現在有多少」。
        </P>
      </Section>

      <Section n={3} title="保底＋上漲：勞保勞退先打底">
        <P>
          你有<B>勞保年金＋勞退月退</B>，這是政府／半政府的終身現金流，等於一份年金。所以你不必存到能 cover 全部開銷，只要 cover「缺口」：
        </P>
        <Formula>自備目標 =（退休後年支出 − 每月保證收入 × 12）÷ 提領率</Formula>
        <P>
          例：年支出 60 萬、勞保勞退每月領 2.5 萬（年 30 萬）→ 缺口 30 萬 ÷ 4% ={" "}
          <B>750 萬</B>。保證收入直接把目標砍半。（工具裡這是手動輸入，去勞保局 App 查實際金額填入；不確定就填 0，偏保守。）
        </P>
      </Section>

      <Section n={4} title="名目 vs 實質：為什麼不是直接用 7%">
        <P>
          全程用「<B>今日購買力</B>」計算最直覺。所以把名目報酬扣掉通膨，換成<B>實質報酬</B>：
        </P>
        <Formula>實質報酬 =(1 + 名目 7%)÷(1 + 通膨 3%)− 1 ≈ 3.9%</Formula>
        <P>
          這樣算出來的「1,500 萬」就是「今天的 1,500 萬購買力」。加薪率同理，用實質。
        </P>
      </Section>

      <Section n={5} title="兩個桶子：投資 vs 現金">
        <P>
          資產不能全用同一個報酬率。股票/ETF 長期實質約 +4%，但<B>銀行存款實質約 0%、甚至略負</B>（利息追不上通膨）。所以拆成兩桶：
        </P>
        <UL>
          <li><B>投資桶</B>：用實質報酬複利成長。</li>
          <li><B>現金桶</B>：幾乎不動。</li>
        </UL>
        <P>
          如果把一大筆現金也用 4% 去滾，會<B>高估</B>未來資產、誤以為能更早退休。分桶才準。
        </P>
      </Section>

      <Section n={6} title="每年存多少？由收入減支出決定">
        <P>累積期每年都把新存的錢投入<B>投資桶</B>，隔年連本帶利再滾：</P>
        <Formula>今年投資 = 去年投資 ×(1 + 實質報酬)+ 當年儲蓄</Formula>
        <P>
          當年儲蓄 = <B>年收入 − 年支出</B>，收入每年隨加薪成長。所以「這樣花會不會延後退休」就一目了然——支出↑ → 儲蓄↓ → 退休年齡往後。退休後沒收入，就停止投入、改成提領缺口。
        </P>
      </Section>

      <Section n={7} title="為什麼 95 歲還剩一大堆錢？">
        <P>
          4% 法則是用<B>最慘的歷史情境</B>回推的，它保證「就算退休就遇到大崩盤又活很久，錢也不會先花光」。代價就是：在<B>正常或好的情境</B>下，資產不但花不完還會繼續長大。
        </P>
        <P>
          只要你假設的<B>實質報酬比提領率高</B>（例如實質 4.9% &gt; 提領 4%），退休後資產就會邊提邊長，幾十年滾成一大筆。那不是浪費，是<B>安全邊際＋遺產</B>。若不在乎留遺產，代表你有空間<B>早點退、或多花一點</B>。
        </P>
      </Section>

      <Section n={8} title="蒙地卡羅：把「市場會抖」算進去">
        <P>
          上面是「每年穩穩 7%」的平滑版本。真實市場會上下震，蒙地卡羅就是<B>跑上千種隨機的市場歷史</B>，看計畫成功的機率。
        </P>
        <P>
          「波動 15%」不是一次跌 15%，而是<B>每年報酬圍繞 7% 上下隨機抽</B>，平均一樣是 7%，只是很顛簸。但<B>波動本身會吃掉複利</B>：
        </P>
        <table className="my-3 w-full overflow-hidden rounded-lg border border-slate-200 text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left">兩年都「平均 +7%」</th>
              <th className="px-3 py-2 text-right">100 元變成</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            <tr className="border-t border-slate-100">
              <td className="px-3 py-2">穩定 +7% / +7%</td>
              <td className="px-3 py-2 text-right font-semibold text-emerald-600">114.5</td>
            </tr>
            <tr className="border-t border-slate-100">
              <td className="px-3 py-2">小震 +20% / −6%</td>
              <td className="px-3 py-2 text-right">112.8</td>
            </tr>
            <tr className="border-t border-slate-100">
              <td className="px-3 py-2">大震 +50% / −36%</td>
              <td className="px-3 py-2 text-right font-semibold text-rose-600">96（反而虧）</td>
            </tr>
          </tbody>
        </table>
        <P>
          三組算術平均都是 7%，但<B>震得越大、實際滾出來越少</B>。再加上退休後遇到壞年還是照提錢（在低點賣股），就是為什麼成功率會掉、甚至一半情境歸零。所以波動度填越高越悲觀；真實的分散組合大約 10–12%。
        </P>
      </Section>

      <Section n={9} title="Coast FIRE：可以停止存錢了嗎？">
        <P>
          Coast FIRE 問的是：<B>如果現在起不再存錢，光靠現有投資複利成長，到 65 歲夠不夠退休？</B>
          如果夠，代表你已經「上岸」——之後工作只需賺生活費，不必再為退休存錢。注意這張卡<B>故意不算新儲蓄</B>，跟主投影的前提不同。
        </P>
      </Section>

      <Section n={10} title="怎麼用：每年回來校準一次就好">
        <P>
          這是 20、30 年的長期規劃，<B>當日股價漲跌對結論幾乎沒影響</B>，不用每月回來填。建議把它當成<B>年度健檢</B>（例如每年初或生日），最多一季一次。
        </P>
        <P>每次回來，重點更新<B>會真正改變結論的東西</B>：</P>
        <UL>
          <li>實際<B>淨值</B>（按一下「抓收盤價」即可）</li>
          <li><B>年收入</B>有沒有變（升遷、換工作、加薪）</li>
          <li><B>實際年支出</B>跟當初估的差多少</li>
          <li>有沒有新的<B>一次性大事</B>要加（買房、生小孩、買車）</li>
        </UL>
        <P>
          每年順手按右上角「<B>匯出備份</B>」存一份，就有逐年紀錄，能看自己有沒有走在軌道上。一句話：<B>把它當「年度對帳＋重新校準」，不是每天看盤。</B>
        </P>
      </Section>

      <Section n={11} title="報酬率怎麼填：別預測，要保守＋壓力測試">
        <P>
          最重要的觀念：<B>你不是要猜對未來報酬，那不可能。</B> 工具的價值是讓你看「不同假設下，結論差多少」。所以：
        </P>
        <UL>
          <li><B>用保守的長期值，不要用最近幾年的熱度</B>（這叫 recency bias，最危險）。最近三五年台股很漂亮，但那是特例，拿來規劃會嚴重高估。</li>
          <li><B>同一個計畫，報酬率填 5%、6%、7% 各跑一次</B>，你會得到一個「退休年齡區間」，而不是一個假精確的點。</li>
          <li>真正的風險檢查交給<B>蒙地卡羅</B>——它已經把「報酬會抖」算進去了。與其糾結平均值，不如看成功率夠不夠高。</li>
        </UL>
        <P>
          參考量級（請自己用 <Code>0050</Code> 或台股報酬指數查證）：長期年化含息大約 <B>8–10% 名目</B>，但個別年份從 −20% 到 +30% 都正常。保守規劃建議用 <B>名目 6–7%、通膨 2.5–3%</B>，波動度 <B>12–14%</B>，想退得早或保守就把提領率調到 <B>3.5%</B>。
        </P>
      </Section>

      <Section n={12} title="動態提領：壞年少花一點，計畫更穩">
        <P>
          蒙地卡羅之所以嚇人，部分是因為預設「<B>不管市場好壞、每年都提一樣多</B>」——這是最脆弱的方式。真實退休的人會在市場差時節省一點。把提領策略改成「<B>動態護欄</B>」就模擬這件事：
        </P>
        <UL>
          <li>市場差 → 資產縮水 → 你的提領率被動衝高 → <B>自動少花一段</B>（例如砍 10%）。</li>
          <li>市場好 → 資產長大 → 提領率偏低 → <B>多花一段</B>。</li>
        </UL>
        <P>
          效果是<B>資產很少真的歸零</B>，蒙地卡羅成功率會明顯跳高。代價是：壞年的生活費會比計畫低。所以它把「錢花光的風險」換成「壞年過得省一點」——這通常是更務實的取捨。在「假設與情境」裡可以切換「固定金額 / 動態護欄」。
        </P>
      </Section>

      <Section n={13} title="反過來問：我到底能花多少？">
        <P>
          前面是「<B>先填支出 → 看成功率</B>」。但更實用的問題是反過來：「<B>我要 90% 的把握，一年最多能花多少？</B>」
        </P>
        <P>
          「可花上限試算」就做這件事——你設定想要的成功率，它用「猜數字」（二分搜尋）反推出對應的最高年支出。這對<B>過度準備</B>的人特別有用：還記得「95 歲還剩一大堆」嗎？這功能會把那個餘裕<B>變成具體數字</B>，例如「在 90% 成功率下，你其實一年可以花 78 萬，而不是 60 萬」。換句話說，它告訴你<B>能多花多少、或可以早幾年退</B>。
        </P>
      </Section>

      <Section n={14} title="你的資料在哪裡？">
        <P>
          全部存在<B>你這台電腦、這個瀏覽器</B>裡（localStorage），<B>不會上傳</B>、沒有後端、沒有帳號。唯一會連網的是「抓收盤價」時把<B>股票代號</B>送去證交所/櫃買/Stooq 換價格——不含你持有幾股、有多少錢。換瀏覽器或清除資料就會不見，想備份可用右上角「匯出備份」。
        </P>
      </Section>

      <p className="border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
        本工具為單一報酬率的規劃估算，僅供學習與參考，非投資建議。
      </p>
    </div>
  );
}

function Intro() {
  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-6">
      <h2 className="text-lg font-bold text-slate-800">這個工具在算什麼？</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        它幫你估「我什麼時候、存到多少可以退休」。下面用白話解釋每個觀念與畫面上每個數字怎麼來的——
        看完再回「試算」分頁玩，你就會知道每個欄位在做什麼。
      </p>
    </div>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-sm text-indigo-700">
          {n}
        </span>
        {title}
      </h3>
      <div className="space-y-2 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}
function B({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-slate-800">{children}</strong>;
}
function UL({ children }: { children: ReactNode }) {
  return <ul className="ml-5 list-disc space-y-1">{children}</ul>;
}
function Code({ children }: { children: ReactNode }) {
  return <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">{children}</code>;
}
function Formula({ children }: { children: ReactNode }) {
  return (
    <div className="my-2 rounded-lg bg-slate-50 px-4 py-3 text-center font-mono text-sm text-indigo-700">
      {children}
    </div>
  );
}
