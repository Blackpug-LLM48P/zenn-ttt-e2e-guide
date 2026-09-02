---
title: "「プロンプトを長くするのをやめろ」Fableのシステムカードから品質保証Agent Skillを作った"
emoji: "🔎"
type: "tech"
topics: ["claude", "agentskills", "llm", "生成ai", "github"]
published: false
---

![STOP WRITING BIGGER PROMPTS](/images/fable-forensic-skill-launch.jpg)

こんにちは、黒パグです🐾

いきなりですが、プロンプトを長くするのをやめてください。

あなたのAgentに必要なのは、さらに4,000文字追加された人格設定ではありません。

必要なのは証拠です。

……という海外驚き屋さん全開の画像と文章をXへ投げました。

しかし、公開したものの中身は最強プロンプトでも、Claude Fable 5.1になりきる人格モードでもありません。調査、実行、検証、失敗記録、修正、再検証を一つの工程として扱う、地味な品質保証型Agent Skillです。

名前は **Fable Forensic Skill**。

https://github.com/Blackpug-LLM48P/fable-forensic-skill

表紙は驚き屋、中を開くと鑑識課です。

## 発端は「完了したのに成果物が壊れている」だった

Claude Fable 5.1とClaude Mythos 5.1のシステムカードを日本語化していたときのことです。

処理ログの上では、翻訳もPDF生成も完了していました。テキスト層にも日本語は入っている。ところが、実際のPDFをレンダリングしてみると、日本語欄がほとんど見えませんでした。

Agentは嘘をついていたわけではありません。実行した処理は成功していました。

ただし、**処理の成功と成果物の成功は別物**です。

ここで必要だったのは、華麗なツール実行履歴を眺めることではありませんでした。最終PDFを開き、ページを画像として描画し、人間が読めるか確認することでした。

この事件が、Skillの中心にある次の一文へつながります。

> Verify the final artifact, not the execution trace.

見るべきなのはAgentの演技ではなく、成果物です。

## 黒パグ式をFable向けにした

黒パグ式は、AIを賢く見せるためのプロンプトではありません。

調査・制作・検証・失敗・修正を再利用可能な工程へ変換し、モデルの出力を人間が鑑識できる状態に保つ品質保証型Agent Skillです。

今回のSkillでは、工程を次のようにまとめました。

```text
Research
  -> Decompose
  -> Execute
  -> Verify
  -> Record failures
  -> Repair
  -> Re-verify
  -> Deliver auditable evidence
```

具体的には、Agentへ次を要求します。

- 依頼範囲と権限境界を最初に固定する
- 観測した事実と推論を分ける
- 未確認の資料を「確認済み」にしない
- サブエージェントへ必要な範囲だけ渡す
- サブエージェントの`completed`を完了証拠として信用しない
- 最終成果物を中間ログから分離する
- 実ファイル、実行結果、描画結果、変更状態を直接確認する
- 失敗した経路を黙って捨てない
- 修正後にもう一度検証する
- 証拠が足りなければ「完了」と言わない

魔法はありません。

あるのは面倒な確認作業だけです。

## システムカードの知見を工程へ変換した

このSkillの差別化点は、Fableという名前や口調ではありません。

システムカードのページ単位の知見を、実務上のワークフロー制御へ変換している点です。

|システムカード上の知見|Skillへ入れた制御|
|---|---|
|最終レポートだけを中間ログから分離して採点（p.179）|成果物そのものを直接検証する|
|非同期サブエージェントには元依頼全文ではなく担当指示を渡す（p.183）|委任時の文脈と権限を最小化する|
|サブエージェントの状態確認と終了が可能（p.183）|`working / idle / completed / blocked / terminated`を管理する|
|マルチエージェントは速度とトークン費用の交換条件（pp.180–183）|並列化を万能扱いせず、品質・遅延・トークン・費用で比較する|
|ユーザーの許可を実際より広く解釈する稀な事例（pp.91–92）|ツールへアクセスできることを実行許可とみなさない|
|未完了タスクを完了と報告する挙動の監査（p.111）|完了報告へ観測可能な証拠を要求する|
|依頼範囲を越える不可逆なツール操作（p.111）|対象、可逆性、承認を実行前に確認する|
|grader awarenessとreward hacking（p.97以降）|推測した隠し採点への最適化を避け、挙動で試験する|

詳細な対応関係と、あえて採用しなかった知見もリポジトリに記録しています。

https://github.com/Blackpug-LLM48P/fable-forensic-skill/blob/main/references/system-card-derived-design.md

なお、本プロジェクトは非公式であり、Anthropicの製品でも、承認を受けた実装でもありません。

## 何でも鑑識すると仕事にならない

品質保証を強くしすぎると、今度は小さな依頼まで全部が大捜査になります。

そこで、Skillには3段階の深さを入れました。

- **Light**：影響が小さく、一回の直接確認で判定できる
- **Standard**：影響が無視できない、または検証が多段階
- **High assurance**：影響が大きい、元へ戻しにくい、本番・公開・外部送信を含む

最初は単純に「ユーザーが`depth: light`と指定したらLight」と書きかけました。

しかし、これでは本番環境へのpushまで、ユーザーがLightと書けば軽量検証へ落とせる余地が残ります。

そこで現在は、影響度を最低深度の床にしています。

|影響度|直接検証|多段階検証|
|---|---:|---:|
|低い|Light|Standard|
|高い・不可逆|High assurance|High assurance|

重大性は検証の簡単さより優先されます。

本番環境への変更は、一つのコマンドと一つの確認で済んでもLightにはなりません。ユーザーは深度を上げられますが、必要な最低深度より下げることはできません。

## Fableに査読させ、GPTが反論し、人間が止めた

SKILL.mdを作った後、Claude Fable 5.1へ読ませました。

Fableは、次の問題を指摘しました。

- 自動発火に使われる具体的な語彙が少ない
- Light / Standard / High assuranceを誰がどう選ぶか曖昧
- サブエージェントの報告自体をどう検証するか書かれていない
- Lightで全完了ゲートを回すと重い

前半3点は採用しました。

一方、Lightから権限確認や直接検証を外す案には反論しました。それを外すと、品質保証Skill自身がfalse completionを再導入するためです。

そこでLightはゲートを削るのではなく、決定的な主張と成果物だけへ小さく適用する設計にしました。

さらに深さ判定を修正する直前、黒パグが言いました。

> その前に整合性チェック忘れずに。死にます。

確認すると、本当に矛盾が見つかりました。

既存文には「ユーザーが指定した深さを原則採用する」とあり、追加案には「重大な作業はHigh assuranceへ昇格する」とありました。`depth: light`と書かれた本番pushで、どちらを優先するかが割れていたのです。

そこで優先順位を固定し、README、SKILL.md、CHANGELOGを横断確認してから公開しました。

変更履歴も公開しています。

https://github.com/Blackpug-LLM48P/fable-forensic-skill/blob/main/CHANGELOG.md

## これがHuman in the Loop

今回、誰か一人が最初から正解を出したわけではありません。

Fableが境界の曖昧さを見つけ、GPTが論理上の反論を行い、黒パグが整合性確認を要求し、Codexが既存規則との衝突を見つけて修正しました。

モデル同士の出力を人間が止め、比較し、再びモデルへ渡したことで品質が上がりました。

Human in the Loopとは、Agentが「完了しました」と言った後にApproveボタンを押すことではありません。

成果物が本当に動くか、人間が輪の中で確認することです。

## 使い方

リポジトリを、利用するAgent環境のSkillsディレクトリへ配置します。構造は次のとおりです。

```text
skills/
└── fable-forensic-skill/
    ├── SKILL.md
    ├── agents/
    │   └── openai.yaml
    └── references/
        ├── system-card-derived-design.md
        └── verification-checklist.md
```

明示的に呼び出せる環境では、次のように使います。

```text
Use $fable-forensic-skill to investigate this failure, implement the repair,
verify the final behavior, and report the evidence and remaining uncertainty.
```

発火条件には、`audit`、`fact-check`、`verify this actually works`、`check the output file`、`confirm it really finished`など、実際の依頼で使われる語彙も入れています。

## まとめ

このSkillは、モデルを魔法のように賢くするものではありません。

失敗を隠しにくくするものです。

調査し、作り、検証し、失敗を残し、直し、もう一度確認する。単純ですが、Agentが長時間動くほど、この地味な工程が効いてきます。

表紙だけは全力で煽りました。

中身まで煽ると死ぬからです。

**VERIFY THE ARTIFACT. NOT THE PERFORMANCE.**

https://github.com/Blackpug-LLM48P/fable-forensic-skill
