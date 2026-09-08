---
title: "GPT-6 Astraに雑なプロンプトを渡すな：Agent Harness設計完全解説"
emoji: "⚙️"
type: "tech"
topics: ["openai", "gpt6", "aiagent", "promptengineering", "codex"]
published: false
---

GPT-6 Astraは、従来モデルより賢い。

だから、雑なプロンプトでも何とかしてくれる。

そう考えているなら危ない。

モデルの能力が上がるほど、曖昧な指示の影響は小さくなるとは限らない。指示を忠実に読み、長いタスクを維持し、ブラウザやコード、各種ツールを横断して作業できるモデルへ、責任境界のない「全部やって」を渡せばどうなるか。

途中で失敗するとは限らない。

そのまま有能に働き、依頼者が想定していなかった場所まで到達する。

逆に、確認条件を過剰に書けば、今度は些細な判断のたびに停止する。慎重さを追加したつもりが、タスクを完了できないAgentを作る。

必要なのは、長い「最強プロンプト」ではない。

必要なのは、モデルがどこまで進み、どこで止まり、誰へ委譲し、何をもって完了とするかを定義した **Agent Harness** である。

その設計を支援するために、ブラウザ上で動作する **Astra Harness Builder** を作った。

- Live App  
  https://astra-harness-builder.llm48.chatgpt.site
- GitHub / Documentation  
  https://github.com/Blackpug-LLM48P/astra-harness-builder

本記事では、GPT-6 Astra向けのプロンプト設計を、単なる文面調整ではなくAI Agentの運用設計として分解する。

## GPT-6 Astraでは何が変わったのか

OpenAIはGPT-6 Astraについて、コンピューター操作、ブラウジング、ソフトウェアエンジニアリング、科学、専門業務などにおける複数段階のワークフローを得意とするモデルだと説明している。

重要なのは、ベンチマークの数字だけではない。

公式のプロンプティングガイドでは、Astra固有の調整対象として次の項目が明示されている。

- Initiative and follow-through
- Instruction following
- Personality and writing style
- Subagent delegation
- Testing and verification

つまり、OpenAI自身が「Astraは賢いので適当に使ってよい」と説明しているわけではない。

モデルの能力を正しく引き出すには、自律性、指示の優先順位、委譲量、文章形式、検証範囲をアプリケーション側で調整する必要がある。

公式ガイドでは、Astraは従来モデルより長いタスクで一貫性を保ちやすい一方、結果を左右する追加情報が必要な場合には質問しやすいとも説明されている。また、Skillsや`AGENTS.md`など、コンテキスト内の指示へ強く反応するため、それらの監査も推奨されている。

ここが最初の落とし穴だ。

「自律的に動け」とだけ書けばよいわけではない。

「慎重に確認しろ」とだけ書けばよいわけでもない。

Astraでは、行動と停止の両方を設計する必要がある。

参考：[OpenAI公式 Model guidance / GPT-6 Astra](https://developers.openai.com/api/docs/guides/latest-model)

## PromptとHarnessは何が違うのか

Promptはモデルへ渡す指示文である。

Harnessは、その指示文を含めて、モデルの行動範囲を制御する運用構造である。

最低限、次の要素を含む。

1. 何を達成するのか
2. どこまで触れてよいのか
3. 何を自律実行してよいのか
4. 何を実行前に確認するのか
5. 誰へ、どの程度まで委譲できるのか
6. 何をもって完了とするのか
7. 失敗時に何回まで再試行するのか
8. 解決できない場合、どこで停止するのか

ここまで定義して初めて、Agentは「適当に動くチャットボット」から「制御可能な実行主体」へ近づく。

ただし、Prompt自体はセキュリティ境界ではない。

「本番環境を削除しないでください」と書くことと、本番環境の削除権限を持たせないことは、まったく違う。

Promptは行動方針を伝える。

実際の権限は、Sandbox、IAM、承認フロー、Tool設定、Network Policy、Audit Logなどで制約する。

この二つを混同してはいけない。

## 「全部やって」が危険なのではない

問題は「全部やって」という言葉そのものではない。

問題は、依頼者の頭にしか存在しない「全部」を、モデルにも共有したつもりになることである。

例えば次の依頼を考える。

> このアプリを完成させて公開しておいて。

人間同士でも曖昧だが、Agent運用ではさらに分岐が増える。

- コードを書くだけか
- テストも行うのか
- Gitへcommitするのか
- GitHubへpushするのか
- Pull Requestを作るのか
- mainへ直接反映するのか
- Hosting環境へdeployするのか
- 公開範囲を変更するのか
- READMEやLICENSEも追加するのか
- 独自ドメインまで設定するのか

「公開して」が、これらすべてを意味するとは限らない。

だから、Task定義には最低でも次の三項目が必要になる。

### Task

達成する成果を一つに絞る。

### Allowed targets

変更してよいRepository、File、Service、Environmentを列挙する。

### Acceptance criteria

第三者が観測できる完了条件を書く。

例えば次のようにする。

```text
Task:
Publish the existing Astra Harness Builder documentation to the specified
public GitHub repository.

Allowed targets:
- Blackpug-LLM48P/astra-harness-builder
- README.md
- LICENSE
- docs/**
- examples/**

Acceptance criteria:
- The repository default branch contains the documentation files.
- README includes the verified live application URL.
- All internal Markdown links resolve to committed files.
- No GitHub Pages deployment is created.
- The live application remains hosted at the existing Sites URL.
```

この粒度なら、GitHub Pagesを勝手に作る余地はかなり減る。

「いい感じで公開して」と書いておきながら、モデルが自分と同じ構成を想像することへ賭けてはいけない。

## 自律性は高ければ高いほどよい、ではない

Astraの自律性を調整する場合、単純なLow、Medium、Highだけでは不十分である。

必要なのは「どの種類の行動を、どこまで自律的に進めてよいか」という分離だ。

例えば、次の行動は同じレベルで扱えない。

- Repository内のFileを読む
- Testを実行する
- 可逆的なCode修正を行う
- 新しいBranchを作る
- Draft PRを作る
- 外部へMessageを送る
- Productionへdeployする
- 公開範囲を変更する
- Fileを削除する
- 課金を伴う操作を行う

読み取りと削除を、同じ「自律実行可能」に入れるべきではない。

Astra Harness Builderでは、自律性と外部操作の扱いを分離している。

高い自律性を与えても、外部書き込みや不可逆操作には承認を要求できる。逆に、低い自律性でも、読み取りやLocal検証まで毎回止める必要はない。

自律性は勇敢さではない。

許可された範囲で、どれだけ判断を省略できるかという運用パラメータである。

## 「確認してください」を増やすほど安全になるわけではない

Approval Gateは必要だ。

しかし、何でも確認させればよいわけではない。

確認を増やしすぎると、Agentは次の状態になる。

1. 読み取り前に確認する
2. 調査前に確認する
3. 修正案を考える前に確認する
4. Test前に確認する
5. 結果をまとめる前に確認する
6. 最後にまた確認する

これではAgentではなく、確認ボタン付きの補完機能である。

公式ガイドでも、承認が必要な作業について、まず承認可能な具体物を準備し、承認を最終段階へ寄せる考え方が示されている。

例えばdeployなら次の順序が合理的である。

1. 要件を確認する
2. Codeを修正する
3. Testする
4. Deploy対象を確定する
5. Diffと検証結果を提示する
6. Production反映の直前で承認を求める
7. 承認後にdeployする
8. 公開結果を確認する

承認ゲートは多さではなく、位置で設計する。

## Multi-Agentは人数を増やせば速くなるのか

ならない。

依存関係の強い作業を大量のSubagentへ配ると、統合コストが増える。

- 同じFileを複数Agentが編集する
- 前提条件が同期されない
- 古い仕様を参照する
- 出力形式が揃わない
- 誰が最終判断を持つのか不明になる
- 各Agentがさらに子Agentを生成する

この問題を防ぐには、少なくとも二つの上限を分ける必要がある。

### Delegation depth

委譲の階層を何段まで許すか。

### Total subagent ceiling

Task全体で何体まで生成できるか。

Depthだけを1に制限しても、Root Agentが100体生成すれば総数は100体になる。

総数だけを10体に制限しても、直列に深く委譲されれば、責任とContextの伝達経路は長くなる。

この二つは別のパラメータである。

さらに、Task Ownerを一体に固定する。

Subagentは調査、比較、独立した実装、Testなどを担当できる。しかし、Task全体の統合、Conflict解消、最終確認、利用者への報告は、明示された一体が責任を持つ。

全員が責任者のTeamは、誰も責任を持っていないTeamとほぼ同じである。

## AGENTS.mdへ全部書くな

Astraは`AGENTS.md`やSkill Fileなど、Context内の長い指示へ強く反応する。

これは利点であると同時に事故原因にもなる。

`AGENTS.md`へ書くべきなのは、RepositoryやOrganizationで継続的に成立するRuleである。

例えば次のような内容だ。

- Code Style
- Test Policy
- File編集規則
- 使用禁止Command
- Deploy権限
- Security要件
- Subagent運用方針
- Reporting形式

一方、今回だけのTaskやAcceptance Criteriaは個別のTask Promptへ置く。

悪い例：

```text
AGENTS.md:
今日中に決済画面を修正し、stagingへdeployして、佐藤さんへ報告する。
```

これは翌日以降も読み込まれる可能性がある。

良い分離：

```text
AGENTS.md:
Production and staging deployments require explicit task-level authorization.
Do not send external messages unless the task names the recipient and purpose.
```

```text
Task prompt:
Fix issue #481 in the checkout confirmation screen.
Deploy the verified change to staging.
After deployment verification, draft—but do not send—a report for Sato.
```

立っている期間が違う指示を同じ場所へ書いてはいけない。

Astra Harness BuilderがFull Prompt、Compact Prompt、`AGENTS.md` Snippetを別々に出力するのはこのためである。

## Acceptance Criteriaは「ちゃんと動くこと」ではない

「正常に動作すること」

「問題がないこと」

「本番品質であること」

これらは完了条件ではない。

評価者ごとに解釈が変わるからだ。

Acceptance Criteriaには、観測可能な状態を書く。

```text
- Unit tests for the modified module pass.
- The static checker reports zero unresolved asset references.
- The generated ZIP contains exactly five expected files.
- The public URL returns the current application.
- No external network request is made by the application runtime.
```

Agentが「できました」と書いた事実は、完了の証拠ではない。

CommandのExit Code、Test結果、Artifactの内容、公開URL、Diff、Logなど、検証可能な証拠を要求する。

ただし、Testも多ければ多いほどよいわけではない。

公式ガイドでは、AstraはCoding TaskのTestを丁寧に行う傾向があり、小さな変更でも必要以上に広いTestへ進む可能性があると説明されている。

そのため、Harness側で次を指定する。

- 変更に直接関係するTest
- 必須のStatic Check
- 広範囲Testへ進む条件
- Retry回数
- Stop Condition

Testが成功した後、理由なく同じTestを繰り返す必要はない。

検証は儀式ではなく、未知を減らすために行う。

## Retryは「成功するまで」ではない

AI Agentへ「失敗したら再試行してください」とだけ書くと、同じ失敗を繰り返す可能性がある。

Retryには上限と分類が必要だ。

```text
Retry policy:
- Retry transient network failures up to two times with bounded backoff.
- Do not retry authentication, permission, policy, or approval failures.
- Do not repeat an unchanged command after a deterministic validation failure.
- Escalate with the failed stage, exact error, and smallest required user action.
```

Networkの一時障害と、Permission拒否は別物である。

認証失敗を100回繰り返しても、認証は成功しない。

Policyで禁止された操作を別経路から実行することは、Retryではなく迂回である。

「何回まで試すか」だけでは不十分だ。

「何を再試行してよいか」を決める必要がある。

## Astra Harness Builderは何を生成するのか

Astra Harness Builderでは、画面上の選択項目から複数の出力を生成する。

### Full operational instruction

一回限りの重いTask向け。

目的、対象、権限、委譲、検証、停止条件、報告形式まで含める。

### Compact task prompt

既存の運用Ruleが整っている環境向け。

短いが情報も削られるため、万能版ではない。

### AGENTS.md snippet

継続的に使うRuleだけを抜き出した断片。

一回限りのTask本文やAcceptance Criteriaは含めない。

### Configuration

選択した設定をMachine-readableな形式で保存する。

比較試験や再現確認に使える。

### Usage notes

生成物の使い分けと制約を説明する。

このToolはModel APIを呼ばない。入力内容を別のLLMへ渡して書き換えさせるのではなく、設定値から決定論的に文章を組み立てる。

理由は単純である。

Promptを生成するたびに別のLLMへ自由生成させると、同じ設定でも出力が変わる。安全上重要な句が欠落する可能性もある。設定比較やRegression Testも難しくなる。

そこで、自由記述部分は利用者が入力し、制御構造は決定論的なCompilerで組み立てる設計にした。

## 敵対的反証で何を確認したか

開発時には、正常系の画面操作だけではなく、設定の組み合わせと境界条件を検証した。

対象は3,888構成。

各構成から3種類の主要出力を生成し、合計11,664出力を検査した。

Regression Testは33件。

主な確認対象は次のとおり。

- 自律性と承認条件の矛盾
- 委譲禁止時にSubagent指示が残らないか
- Maximum depthとTotal ceilingの整合性
- Task Ownerの欠落
- Acceptance Criteriaの欠落
- Retry上限の欠落
- 外部書き込み条件の欠落
- `AGENTS.md`断片への一回限りのTask混入
- ZIP内のFile構成
- 文字列Escape
- Static Asset参照
- Browser外部通信の有無

これは、すべての危険を証明したという意味ではない。

検査した範囲で、既知の不整合を機械的に検出できたという意味である。

Prompt設計に「完全」は存在しない。

だからこそ、設計上の主張と、Testで確認した範囲を分けて書く必要がある。

## 危険な設定例

次のような指示は、一見すると強力である。

```text
Complete every task autonomously.
Delegate whenever possible.
Never stop until the goal is achieved.
Do not ask the user unnecessary questions.
Fix any issue you encounter.
Run all relevant tests.
```

しかし、運用上は問題が多い。

- every taskの範囲が不明
- delegateの総数上限がない
- never stopとApproval Gateが衝突する
- unnecessary questionの判定基準がない
- any issueに無関係な既存不具合が含まれる
- all relevant testsの上限がない
- 外部操作とLocal操作が分離されていない

次のように境界を与える。

```text
Carry the requested task to completion within the explicitly allowed targets.

Use subagents only for independent subtasks that reduce wall-clock time or
provide a genuinely separate verification path.
Maximum delegation depth: 1.
Total subagent ceiling: 4.
The root agent owns integration and final verification.

Complete reversible local work without additional approval.
Request approval immediately before public communication, production
deployment, destructive action, purchase, credential mutation, or any
operation outside the allowed targets.

Run tests directly relevant to changed behavior and required repository checks.
Broaden testing only after a failure, an unresolved dependency, or a change
with wider impact.

Retry transient failures at most twice.
Stop on authentication, permission, policy, or approval failures and report
the smallest required user action.
```

長くなったから優れているのではない。

曖昧だった変数へ値を入れたから、運用可能になっている。

## Astra Harness Builderを実際に使う

使い方は次のとおり。

1. Astra Harness Builderを開く
2. Presetを選択する
3. Taskへ一つの成果を書く
4. Allowed Targetsへ触れてよい範囲を書く
5. Acceptance Criteriaへ観測可能な完了条件を書く
6. Autonomyを選ぶ
7. Delegation条件と上限を選ぶ
8. PermissionsとApproval Gateを選ぶ
9. VerificationとRetry Policyを選ぶ
10. Writing Styleを選ぶ
11. Blocking Errorを解消する
12. Warningを確認する
13. 用途に合うOutputをCopyする
14. 実環境側でTool権限を設定する

Live App：

https://astra-harness-builder.llm48.chatgpt.site

取扱説明書：

https://github.com/Blackpug-LLM48P/astra-harness-builder

## このToolが守ってくれる、とは言っていない

最後に最も重要な制約を書く。

Astra Harness BuilderはPromptを生成する。

権限を制御するわけではない。

- Production環境への接続権限
- GitHubへのWrite権限
- 外部Serviceへの投稿権限
- 課金操作
- 個人情報へのAccess
- File削除
- Network Access
- Sandbox境界

これらは実行環境で制御する必要がある。

また、入力検査はHeuristicであり、完全なSecret ScannerでもPrompt Injection Detectorでもない。

正規表現を追加しただけで安全なAI Agentが完成するなら、誰も苦労しない。

Harness Builderが提供するのは、運用設計を忘れないための構造と、設定から一貫した指示を生成する仕組みである。

最終的な安全性は、Model、Prompt、Tool Permission、Approval Flow、Audit、Test、組織Ruleを組み合わせて作る。

## まとめ

GPT-6 Astraは高性能である。

だからこそ、雑な指示を渡してはいけない。

必要なのは、モデルへ「賢く動け」と頼むことではない。

- 目的を一つにする
- 操作対象を限定する
- 自律実行できる範囲を決める
- 外部操作の承認地点を決める
- 委譲深度と総数上限を分ける
- Task Ownerを固定する
- 完了条件を観測可能にする
- Retryと停止条件を定義する
- 永続指示と一回限りの指示を分離する
- 実際の権限をPromptの外側で制御する

この設計が必要になる。

モデルが弱い時代は、AIが途中で失敗した。

モデルが強い時代は、間違った設計のまま最後まで成功する。

そちらの方が危険である。

Astra Harness Builderは、GPT-6 Astraを縛るための道具ではない。

Astraの能力を、利用者が説明できる範囲へ収めるための道具である。
