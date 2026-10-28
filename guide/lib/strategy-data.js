'use strict';
// Beginner guide content for the dashboard 공략 tab. Facts are from deadlock.wiki (2026-10), the
// deadlock-api snapshot and analytics, the DCInside Deadlock gallery guides and the YouTube guides
// listed below; each section names its sources. Numbers change with patches: dates are noted.
window.STRATEGY = {
  updated: '2026-10-24',
  // Net worth by minute, average +- std over the last 30 days of normal games
  // (api.deadlock-api.com/v1/analytics/player-performance-curve).
  worth: {
    minutes: [6, 9, 12, 15, 20, 30],
    low: [3600, 6000, 8900, 12100, 17700, 31100],
    mid: [3700, 6200, 9300, 12600, 18400, 32100],
    high: [3900, 6600, 9800, 13200, 19100, 32600],
    lowSd: [500, 900, 1300, 1700, 2500, 4400]
  },
  // Soul sources at 15:00 by rank (same source): jungle and breakables make the difference, not lanes.
  sources15: [
    { name: '전선(트루퍼)', nameEn: 'Lane (Troopers)', low: 3650, high: 3700 },
    { name: '정글 캠프', nameEn: 'Jungle camps', low: 1175, high: 1740 },
    { name: '상자·영혼 슬롯머신', nameEn: "Crates · Sinner's Sacrifice", low: 835, high: 1281 }
  ],
  // Top ranks (badge 110+, about the top 2% of ranked games) vs low ranks (badge 10-39), normal games,
  // api.deadlock-api.com/v1/sql on 2026-10-26. Match rows: last 14 days, games over 15 min. Player rows
  // (per player, at 15:00): last 5 days, games over 20 min. Times in seconds.
  ranks: {
    checked: '2026-10-26',
    games: { top: 6421, low: 127258 },
    players: { top: 30245, low: 536189 },
    match: [
      { name: '경기 시간', nameEn: 'Match length', top: 1866, low: 2244, kind: 'time' },
      { name: '첫 가디언 파괴', nameEn: 'First Guardian destroyed', top: 382, low: 472, kind: 'time' },
      { name: '10분까지 부서진 가디언 (양 팀 6개 중)', nameEn: 'Guardians destroyed by 10 min (of 6, both teams)', top: 3.58, low: 2.05, kind: 'dec' },
      { name: '첫 워커 파괴', nameEn: 'First Walker destroyed', top: 819, low: 947, kind: 'time' },
      { name: '첫 중앙 보스 처치', nameEn: 'First Mid-Boss kill', top: 1098, low: 1638, kind: 'time' },
      { name: '소생의 보석을 상대 팀이 가로챈 비율', nameEn: 'Rejuvenator stolen by the other team', top: 16.1, low: 8.3, kind: 'pct' }
    ],
    player: [
      { name: '15분 순자산', nameEn: 'Net worth at 15 min', top: 13362, low: 12065, kind: 'n' },
      { name: '15분까지 정글 캠프 영혼', nameEn: 'Jungle camp Souls by 15 min', top: 1722, low: 1146, kind: 'n' },
      { name: '15분까지 구조물·보스 영혼', nameEn: 'Structure · boss Souls by 15 min', top: 959, low: 760, kind: 'n' },
      { name: '15분까지 영웅 처치 영혼', nameEn: 'Hero kill Souls by 15 min', top: 1948, low: 1787, kind: 'n' },
      { name: '잡을 수 있던 트루퍼 중 처치 비율', nameEn: 'Share of available Troopers killed', top: 72.4, low: 66.7, kind: 'pct' },
      { name: '15분까지 죽은 횟수', nameEn: 'Deaths by 15 min', top: 2.74, low: 2.33, kind: 'dec' },
      { name: '15분까지 죽어서 떨어뜨린 영혼', nameEn: 'Souls dropped on death by 15 min', top: 313, low: 185, kind: 'n' }
    ],
    // Share of structure damage done by troopers (last 7 days), and what the team holding the
    // 소생의 보석 does next: at least one enemy structure within 3 minutes / average structures.
    trooperDamage: { guardian: [38.4, 42.9], walker: [34.0, 39.3] },
    bossNext: { pct: [78.2, 74.2], count: [2.02, 2.31], win: [72.1, 74.4] },
    // Team net worth gap at 15:00 and the win rate of the team ahead (last 4 days, all ranks alike).
    lead: [
      { gap: '3k~8k', win: 67 },
      { gap: '8k 이상', gapEn: '8k+', win: 83 }
    ]
  },
  share: [
    { n: 1, each: 100, total: 100 },
    { n: 2, each: 54, total: 108 },
    { n: 3, each: 36, total: 108 },
    { n: 4, each: 25, total: 100 },
    { n: 5, each: 20, total: 100 },
    { n: 6, each: 16, total: 96 }
  ],
  timeline: [
    { t: 0, label: '전선 시작', note: '웨이브 30초마다', labelEn: 'Lanes start', noteEn: 'Wave every 30 sec' },
    { t: 120, label: '소형 캠프', note: '리스폰 1:25', labelEn: 'Small camps', noteEn: 'Respawn 1:25' },
    { t: 180, label: '상자', note: '3분마다 재생성', labelEn: 'Crates', noteEn: 'Every 3 min' },
    { t: 300, label: '중형 캠프 · 기운의 파편', note: '버프는 5분마다', labelEn: 'Medium camps · Power-up', noteEn: 'Buff every 5 min' },
    { t: 480, label: '대형 캠프 · 영혼 슬롯머신', note: '영혼 슬롯머신 리스폰 5분', labelEn: 'Large camps · Sacrifice', noteEn: 'Sacrifice respawn 5 min' },
    { t: 600, label: '영혼 단지', note: '5분마다 · 짝수 분 노랑', labelEn: 'Soul Urn', noteEn: 'Every 5 min · even min Yellow' },
    { t: 680, label: '균열', note: '첫 열림 11:20~13:20', labelEn: 'Rift', noteEn: 'First opens 11:20~13:20' }
  ],
  youtube: [
    {
      id: '_8gjxr5fZBI',
      title: '데드락 뉴비들이 시작 전 꼭 알아야 할 설정들 (뉴비 필수 시청!!)',
      channel: 'NightMare 장욱',
      date: '2026-10-20',
      length: '12:40',
      lang: 'ko',
      cat: '기초',
      why: '첫 판 전에 10분이면 끝나는 설정만으로 빌드·핑이 편해집니다.',
      titleEn: 'Settings Deadlock beginners must know before starting (must-watch for beginners)',
      channelEn: 'NightMare Janguk',
      catEn: 'Basics',
      whyEn: 'Ten minutes of settings before your first game make builds and pings easier.',
      takeawaysEn: [
        'Set the Build Browser language to English to also find top builds from other regions.',
        'Check the update date on saved builds, and get them again from public builds if they are old.',
        'Use alt-cast (hold · double-press) to cast shield items on yourself at once.',
        'Right-click in the shop to queue a purchase; drag to change the order.'
      ],
      chapters: [
        ['0:12', '빌드 검색 언어 설정', 'Build search language'],
        ['0:51', '빌드 최신화', 'Updating builds'],
        ['1:52', '영웅별 조준', 'Per-hero aim'],
        ['3:15', '대체 시전 능력 키', 'Alt-cast ability keys'],
        ['4:58', '능력·아이템 즉시 시전(스마트 키)', 'Instant Cast for abilities · items (smart keys)'],
        ['7:16', '핑 단축키와 사용법', 'Ping keys and how to use them'],
        ['9:26', '예약 구매', 'Queued purchases'],
        ['10:17', 'FOV 설정', 'FOV setting']
      ],
      takeaways: [
        '빌드 브라우저 언어를 영어로 바꾸면 해외 상위권 빌드까지 검색됩니다.',
        '저장한 빌드는 업데이트 날짜를 보고, 오래됐으면 공개 빌드에서 다시 받으세요.',
        '대체 시전(길게·두 번 누르기)으로 실드류 아이템을 자신에게 바로 씁니다.',
        '상점에서 우클릭하면 예약 구매, 순서는 드래그로 바꿉니다.'
      ]
    },
    {
      id: 'vU8U2-kjqv4',
      title: '데드락의 기본 개념 요약 정리! [뉴비 가이드 1편: 데드락의 기초]',
      channel: '네크로',
      date: '2026-03-29',
      length: '10:27',
      lang: 'ko',
      cat: '기초',
      old: '맵·상점 위치는 9월 패치 전 기준',
      why: '데드락 용어(은총·디나이·장막)를 한국어로 한 번에 정리합니다.',
      titleEn: 'Deadlock basic concepts summarized [Beginner guide part 1: Deadlock basics]',
      channelEn: 'Necro',
      catEn: 'Basics',
      oldEn: 'Map and shop locations are from before the September patch',
      whyEn: 'Explains Deadlock terms (Boons · denies · Veils) in Korean in one go.',
      takeawaysEn: [
        'Shooting while running fast or sliding down a slope uses no ammo.',
        'Shoot floating soul orbs first to stop denies. A melee last hit is yours at once.',
        'Getting hit right after boarding a Zipline or Jump Pad means heavy damage and a stun. Press crouch to get off a Zipline.',
        'An item bought by mistake is fully refunded before you leave the shop area, otherwise 50%.'
      ],
      chapters: [
        ['0:51', '게임 흐름', 'Game flow'],
        ['1:55', '조작', 'Controls'],
        ['3:35', '트루퍼', 'Troopers'],
        ['4:51', '로프·집라인·점프 패드', 'Ropes · Ziplines · Jump Pads'],
        ['6:16', '상점', 'Shop'],
        ['7:10', '영혼과 은총', 'Souls and Boons'],
        ['7:53', '아이템 구매', 'Buying items'],
        ['8:44', '소통', 'Communication']
      ],
      takeaways: [
        '빠르게 달리거나 경사로에서 활주(슬라이딩)하는 동안 쏘면 탄약이 줄지 않습니다.',
        '공중 영혼 구슬은 먼저 쏴야 디나이를 막습니다. 근거리 공격 막타는 즉시 획득.',
        '집라인·점프 패드 탑승 직후 맞으면 큰 피해와 기절. 집라인은 앉기 키로 내립니다.',
        '잘못 산 아이템은 상점 범위를 벗어나기 전이면 전액 환불, 아니면 50%.'
      ]
    },
    {
      id: '7L-j1mjASk0',
      title: 'Deadlock for Beginners in 20 Minutes - Updated Late 2026',
      channel: 'Deathy',
      date: '2026-10-07',
      length: '23:19',
      lang: 'en',
      cat: '기초',
      why: '새 맵 기준으로 타이머와 오브젝트를 가장 깔끔하게 정리한 영상입니다.',
      catEn: 'Basics',
      whyEn: 'The cleanest rundown of timers and objectives on the new map.',
      takeawaysEn: [
        'A successful Parry gives you time for 2 heavy melees. A miss means a 4.5-sec cooldown.',
        "Start the heavy melee on a Sinner's Sacrifice with 3 lights left (4 for the fast red type) → 4 permanent buffs.",
        'Souls earned in the jungle drop when you die. Spend them as soon as you can afford something.',
        'When the Rift opens, the losing team gets a resistance bonus, so the further behind you are, the more you should fight.',
        'Walkers are a stretch before 13~14 min. Take the Mid-Boss first, then head for their base.'
      ],
      chapters: [
        ['1:32', '이동', 'Movement'],
        ['4:03', '근거리 공격과 방어(패링)', 'Melee and Parry'],
        ['5:44', '영웅 고르기', 'Picking a hero'],
        ['6:47', '라인전', 'Laning'],
        ['8:58', '빌드', 'Builds'],
        ['10:12', '타이머와 오브젝트', 'Timers and objectives'],
        ['12:52', '중앙 보스', 'Mid-Boss'],
        ['15:08', '영혼 단지', 'Soul Urn'],
        ['16:21', '균열', 'Rift'],
        ['17:57', '워커', 'Walkers'],
        ['20:38', '게임 끝내기', 'Ending the game']
      ],
      takeaways: [
        '방어(패링)에 성공하면 강한 근거리 공격 2번을 넣을 시간이 생깁니다. 실패하면 4.5초 쿨.',
        '영혼 슬롯머신은 불빛이 3개 남았을 때 강한 근거리 공격 시작(빠른 빨간 타입은 4개) → 영구 버프 4개.',
        '정글에서 번 영혼은 죽으면 떨어뜨립니다. 살 돈이 되면 바로 쓰세요.',
        '균열이 열리면 지는 팀이 저항 보너스를 받으니 뒤처질수록 꼭 싸우세요.',
        '워커는 13~14분 전엔 무리. 중앙 보스를 먼저 잡고 본진으로.'
      ]
    },
    {
      id: 'GEMrYWPraYo',
      title: "The *NEW* COMPLETE DEADLOCK Beginner's Guide - Everything you NEED to Know Before you Play!",
      channel: 'Paz',
      date: '2026-09-29',
      length: '23:28',
      lang: 'en',
      cat: '기초',
      why: '패치 당일 나온 대표 입문 영상. 자동 한국어 자막이 있습니다.',
      catEn: 'Basics',
      whyEn: 'The go-to beginner video, out on patch day. Has auto-generated Korean subtitles.',
      basisEn: 'the chapters · description',
      takeawaysEn: [
        "Hit a fast (red) Sinner's Sacrifice with a heavy melee at the 4th light from the end.",
        'The description links a spreadsheet of builds per hero.'
      ],
      chapters: [
        ['1:07', '기본', 'Basics'],
        ['2:21', '영웅', 'Heroes'],
        ['4:36', '역할', 'Roles'],
        ['6:20', '초반', 'Early game'],
        ['9:56', '새 정글', 'New jungle'],
        ['14:09', '중반', 'Mid game'],
        ['15:12', '영혼 단지', 'Soul Urn'],
        ['17:12', '균열', 'Rift'],
        ['19:04', '후반', 'Late game'],
        ['20:44', '공성', 'Sieging'],
        ['22:28', '마무리 팁', 'Final tips']
      ],
      takeaways: ['빠른(빨간) 영혼 슬롯머신은 끝에서 4번째 불빛에 강한 근거리 공격.', '설명란에 영웅별 빌드 스프레드시트 링크가 있습니다.'],
      basis: '챕터·설명란 기준'
    },
    {
      id: 'k9TRQjvlj3o',
      title: '8개월 만의 메이저 업데이트 [데드락 메이저 업데이트: 잠들지 않는 도시]',
      channel: '네크로',
      date: '2026-09-29',
      length: '27:43',
      lang: 'ko',
      cat: '정글·매크로',
      why: '새 맵 변경점을 한국어로 훑을 수 있는 거의 유일한 영상입니다.',
      titleEn: 'The first major update in 8 months [Deadlock major update: City Never Sleeps]',
      channelEn: 'Necro',
      catEn: 'Jungle · macro',
      whyEn: 'Almost the only video covering the new map changes in Korean.',
      takeawaysEn: [
        'Tough crates only break to a heavy melee.',
        'Neutral respawn timers are only visible on the spot. Lookout shows them on the minimap for you.',
        'The Broker appears at a random spot from 30 min. Corrupting an item makes it stronger + adds a random drawback.',
        'You are hidden on top of steam vents; the fog in the fog plaza hides sight and sound and drains Stamina. The HUD shows whether enemy ultimates are up, and Stamina.'
      ],
      chapters: [
        ['0:00', '개요', 'Overview'],
        ['1:00', '새 맵 지명', 'New map place names'],
        ['3:30', '새 중립 유닛·튼튼한 상자', 'New neutrals · tough crates'],
        ['6:00', '회복 간식', 'Healing snacks'],
        ['7:30', '안개·증기 구역', 'Fog · steam zones'],
        ['8:00', '브로커·타락 아이템', 'Broker · corrupted items'],
        ['11:00', '빌드 브라우저', 'Build Browser'],
        ['18:00', 'HUD 변경', 'HUD changes'],
        ['22:00', '신규 영웅', 'New heroes']
      ],
      chaptersMade: true,
      takeaways: [
        '튼튼한 상자는 강한 근거리 공격으로만 부서집니다.',
        '중립 유닛 리스폰 타이머는 현장에서만 보입니다. Lookout이 미니맵에 대신 띄워 줍니다.',
        '브로커는 30분부터 랜덤 위치에 등장. 아이템을 타락시키면 강화 + 랜덤 디버프.',
        '증기 구멍(스팀 벤트) 위에선 은신, 안개 광장 안개는 시야·소리를 가리고 활력(스태미나)을 깎습니다. HUD에 적 궁극기 유무와 활력(스태미나)이 표시됩니다.'
      ]
    },
    {
      id: 'QcpZh1fQf4g',
      title: "How to OUTFARM Your Opponent in EVERY Lane | Deadlock Beginner's Guide",
      channel: 'Ghoul',
      date: '2026-10-09',
      length: '22:04',
      lang: 'en',
      cat: '라인전',
      why: '"10분에 5천 뒤처지는" 원인을 오브젝트 타이머 단위로 짚어 줍니다.',
      catEn: 'Laning',
      oldEn: 'The 60:40 ground/floating split in the video is from before the June 30 patch (now 50:50)',
      whyEn: 'Breaks down why you end up "5k behind at 10 min", one objective timer at a time.',
      takeawaysEn: [
        "Key idea: push the wave 30 sec before each objective. 1:30 → 2-min camps, 2:30 → crates, 4:30 → Power-up, 7:30 → Sinner's Sacrifice.",
        'If you lose control in the first 2 min, saving your health under the Guardian comes first.',
        "A lone Sinner's Sacrifice respawns 5 min after it is destroyed."
      ],
      chapters: [
        ['1:00', '웨이브 주도권', 'Wave control'],
        ['2:00', '영혼 분배', 'Soul sharing'],
        ['4:00', '첫 2분', 'First 2 min'],
        ['6:00', '오브젝트 타이머', 'Objective timers'],
        ['14:00', '주도권과 타이머 연결', 'Linking wave control and timers'],
        ['20:00', '정리', 'Recap']
      ],
      chaptersMade: true,
      takeaways: [
        '핵심: 오브젝트 30초 전에 웨이브를 먼저 밉니다. 1:30 → 2분 캠프, 2:30 → 상자, 4:30 → 기운의 파편, 7:30 → 영혼 슬롯머신.',
        '첫 2분에 주도권을 잃으면 가디언 밑에서 체력 보존이 먼저입니다.',
        '영혼 슬롯머신은 단독 기계 기준 파괴 후 5분 뒤 재생성.'
      ],
      old: '영상의 바닥/공중 60:40은 6월 30일 패치 이전 비율(현재 50:50)'
    },
    {
      id: 'bCHS9_h3YhI',
      title: '데드락 뉴비들이 10분까지 알아야 할 운영 (뉴비 필수 시청!!)',
      channel: 'NightMare 장욱',
      date: '2026-08-24',
      length: '12:49',
      lang: 'ko',
      cat: '라인전',
      old: '상자·영혼 슬롯머신 위치는 9월 패치 전 맵',
      why: '0~10분 동선을 분 단위로 보여줍니다. 웨이브 원리는 지금도 유효합니다.',
      titleEn: 'Play Deadlock beginners need to know up to 10 min (must-watch for beginners)',
      channelEn: 'NightMare Janguk',
      catEn: 'Laning',
      oldEn: "Crate and Sinner's Sacrifice spots are on the pre-September map",
      whyEn: 'Shows the 0~10 min route minute by minute. The wave principles still hold.',
      basisEn: 'the recap screen at the end and the subtitles',
      takeawaysEn: [
        'Every step assumes you pushed the lane first. The overlay reminds you 30 sec before each time.',
        '1:30 → 2-min small camps. Decide with your teammates whether to go into enemy-side camps; if unsure, only your side.',
        '2:30 → 3-min crate route. If you pushed first, clear the enemy-side crates too, and one player holds the lane.',
        '4:30 → 5-min Power-up. Check the other lanes to decide where to go. Break leftover crates on the way back.',
        "After the Power-up: push the Guardian, roam or go back to base. The Guardian is best right after a kill; don't die defending it.",
        "7:30 → 8-min Sinner's Sacrifice. If ahead, quickly take the enemy's; if behind, guard yours.",
        '9:30 → the Power-up fight on the Soul Urn side. The Urn always appears in the Yellow lane first. Save long-cooldown ultimates for this fight.',
        'When you have the most Souls on your team, your respawn is longer, so play not to die.'
      ],
      chapters: [
        ['1:34', '2분 (소형 캠프)', '2 min (small camps)'],
        ['2:22', '3분 (상자)', '3 min (crates)'],
        ['4:23', '5분 (버프)', '5 min (buff)'],
        ['7:22', '8분 (영혼 슬롯머신)', "8 min (Sinner's Sacrifice)"],
        ['8:51', '10분 (버프·영혼 단지)', '10 min (buff · Soul Urn)'],
        ['12:34', '내용 정리', 'Recap']
      ],
      takeaways: [
        '모든 순서는 라인을 먼저 밀어 둔 뒤의 이야기입니다. 오버레이가 각 시각 30초 전에 알려 줍니다.',
        '1:30 → 2분 소형 캠프. 상대 쪽 캠프까지 들어갈지는 아군과 정하고, 애매하면 우리 쪽만.',
        '2:30 → 3분 상자 동선. 먼저 밀었으면 상대 쪽 상자까지 털고, 한 명은 전선을 받아 둡니다.',
        '4:30 → 5분 기운의 파편. 다른 라인 상황을 보고 어느 쪽으로 갈지 정합니다. 돌아오며 남은 상자도 깨기.',
        '파편을 먹은 뒤엔 가디언 밀기·로밍·귀환 중 하나. 가디언은 킬을 낸 직후가 좋고, 막다가 죽지는 않기.',
        '7:30 → 8분 영혼 슬롯머신. 유리하면 상대 것을 빠르게 털고, 불리하면 우리 쪽을 지킵니다.',
        '9:30 → 영혼 단지 쪽 기운의 파편 싸움. 단지는 항상 노란색 전선에 먼저 나옵니다. 쿨이 긴 궁극기는 이 싸움까지 아끼기.',
        '팀에서 영혼이 가장 많을 때는 부활 시간이 길어지니 죽지 않는 플레이.'
      ],
      basis: '영상 끝의 정리 화면과 자막'
    },
    {
      id: 'IDxXf-URcXU',
      title: "Just Give Me 33 Minutes, You'll Out Farm Everyone | Deadlock Farming Guide",
      channel: 'Shotty',
      date: '2026-09-07',
      length: '33:07',
      lang: 'en',
      cat: '영혼·파밍',
      old: '패치 3주 전. 정글 위치·영혼 단지 규칙 일부 변경',
      why: '"파밍했는데 돈이 없다"는 사람의 사고방식을 교정합니다.',
      catEn: 'Souls · farming',
      oldEn: 'Three weeks before the patch. Some jungle spots and Soul Urn rules changed',
      whyEn: 'Fixes the mindset of players who "farmed but have no Souls".',
      takeawaysEn: [
        "Priority: lane > Sinner's Sacrifice > camps · crates. When the wave comes, drop the camp and go to lane.",
        "Basic loop: push 2 waves → crates · camps · Sinner's Sacrifice → back before the next wave.",
        "\"Negative Souls\": deaths, going back to base and zoning out all cost you. Use the middle shop instead of your base.",
        "Don't cross the middle line when 3 or more enemies are missing and you are holding Souls."
      ],
      chapters: [
        ['0:11', '기본 팁', 'Basic tips'],
        ['6:54', '기본 팁 2', 'Basic tips 2'],
        ['21:09', '라인전 파밍', 'Farming in lane'],
        ['27:11', '오브젝트', 'Objectives']
      ],
      takeaways: [
        '우선순위: 전선 > 영혼 슬롯머신 > 캠프·상자. 웨이브가 오면 캠프는 버리고 전선으로.',
        '기본 루프: 웨이브 2개 밀기 → 상자·캠프·영혼 슬롯머신 → 다음 웨이브 전 복귀.',
        '"마이너스 영혼": 죽음·귀환·멍때림은 전부 손해. 기지 대신 중앙 상점 활용.',
        '적 3명 이상이 안 보이고 영혼을 들고 있으면 중앙선 넘지 않기.'
      ]
    },
    {
      id: 'w79AOu3nfHk',
      title: '이것만 고쳐도 저티어를 탈출합니다 [데드락 가이드]',
      channel: '네크로',
      date: '2026-09-04',
      length: '10:00',
      lang: 'ko',
      cat: '영혼·파밍',
      old: '패치 전. 균열 타이밍 등',
      why: '한국어 저티어 실수 교정 영상 중 가장 실전적입니다.',
      titleEn: 'Fix just this and you escape low ranks [Deadlock guide]',
      channelEn: 'Necro',
      catEn: 'Souls · farming',
      oldEn: 'Before the patch. Rift timing, etc.',
      whyEn: 'The most practical of the Korean videos fixing low-rank mistakes.',
      takeawaysEn: [
        "\"I'm always the one with no Souls\" usually means you abandoned your lane. When losing, push only to the middle line.",
        "With 3 or more together, Souls per hero drop a lot. Don't move as a group.",
        "If you broke a Walker, that turn is spent. Don't force it; regroup.",
        'Denying is about awareness, not reaction speed. Keep 1 bullet after the last hit.'
      ],
      chapters: [
        ['0:00', '전선 밀기', 'Pushing lanes'],
        ['1:40', '파밍 우선순위·영혼 슬롯머신', "Farming priority · Sinner's Sacrifice"],
        ['2:30', '캐리의 착각', "The carry's mistake"],
        ['3:00', '오브젝트 타이밍', 'Objective timing'],
        ['5:20', '턴 개념', 'The idea of turns'],
        ['7:20', '근접·디나이', 'Melee · denies'],
        ['8:00', '빌드 순서·카운터템', 'Build order · counter items']
      ],
      chaptersMade: true,
      takeaways: [
        '"항상 나만 돈이 없다"는 대부분 전선을 버린 경우. 질 때는 중앙선까지만 밀기.',
        '3명 이상 모이면 1인당 영혼이 크게 줄어듭니다. 뭉쳐 다니지 마세요.',
        '워커를 깼으면 그 턴은 썼습니다. 무리하지 말고 정비.',
        '디나이는 반응속도가 아니라 인식 문제. 막타 후 총알 1발을 남겨 두세요.'
      ]
    },
    {
      id: 'xGM5mk98axI',
      title: '데드락 뉴비라면 무조건 알아야 할 소울 버는 법 총정리',
      channel: 'NightMare 장욱',
      date: '2026-08-28',
      length: '6:17',
      lang: 'ko',
      cat: '영혼·파밍',
      why: '영혼이 들어오는 길(트루퍼·상자·정글·오브젝트·처치)을 6분 동안 하나씩 짚어 줍니다.',
      titleEn: 'Everything Deadlock beginners must know about earning Souls',
      channelEn: 'NightMare Janguk',
      catEn: 'Souls · farming',
      whyEn: 'Goes through every Soul source (Troopers · crates · jungle · objectives · kills) one by one in 6 min.',
      takeawaysEn: [
        "Two standing in one lane each get only 54% of Trooper Souls. As a carry, say up front: \"I'll farm this lane alone.\"",
        'Crates give Souls 60% of the time when broken, Golden Statues a permanent stat 50% of the time. Their spots are fixed, so learn them and fit them into your route.',
        "Priority is lane → jungle camps → crates. When it's safe, take the enemy jungle first. Your Souls go up and theirs go down.",
        'The Soul Urn gives Souls to whoever delivers it, and allies who collect the dropped orbs share them. The Urn and Rift give the losing team a bonus, so a carry should check the map first rather than always carrying the Urn.',
        'Walker Souls are split into a share for heroes nearby and a share for the whole team (40/60 when the video was made, 25/75 after the September patch). If you can break it alone, it is often worth it even if you die, but after 15~20 min it may cost you the Mid-Boss.'
      ],
      chapters: [
        ['0:42', '영혼이란', 'What Souls are'],
        ['1:02', '트루퍼와 영혼 분배', 'Troopers and Soul sharing'],
        ['2:06', '상자·황금 조각상', 'Crates · Golden Statues'],
        ['2:38', '정글과 우선순위', 'Jungle and priority'],
        ['3:06', '영혼 슬롯머신', "Sinner's Sacrifice"],
        ['3:40', '영혼 단지', 'Soul Urn'],
        ['4:22', '균열', 'Rift'],
        ['4:42', '처치', 'Kills'],
        ['5:04', '워커', 'Walkers'],
        ['5:28', '정리', 'Recap']
      ],
      chaptersMade: true,
      takeaways: [
        '한 전선에 둘이 서면 트루퍼 영혼을 각자 54%만 받습니다. 캐리라면 "이 전선은 제가 혼자 먹을게요"라고 미리 말해 두세요.',
        '상자는 부수면 60% 확률로 영혼, 황금 조각상은 부수면 50% 확률로 영구 능력치. 위치가 고정이라 외워서 동선에 넣습니다.',
        '우선순위는 전선 → 정글 캠프 → 상자. 안전하면 상대 정글을 먼저 뺏으세요. 내 영혼이 늘고 상대 몫은 줄어듭니다.',
        '영혼 단지는 배달한 사람이 영혼을 받고, 떨어진 구슬을 아군이 챙기면 나눠 갖습니다. 단지와 균열은 지는 팀에 보정이 붙으니, 캐리는 무조건 들기보다 맵 상황을 먼저 봅니다.',
        '워커 영혼은 근처 영웅 몫과 팀 전원 몫으로 나뉩니다(영상 당시 40/60, 9월 패치 후 25/75). 혼자 깰 수 있으면 죽어도 이득인 경우가 많지만 15~20분 뒤엔 중앙 보스를 내줄 수 있습니다.'
      ]
    },
    {
      id: 'DCO1AQQjZG0',
      title: 'The REAL Way To Get Ahead In Deadlock (New Macro Guide)',
      channel: 'Metro Deadlock',
      date: '2026-09-30',
      length: '14:06',
      lang: 'en',
      cat: '영혼·파밍',
      why: '새 정글에서 영혼을 버는 법을 가장 압축적으로 정리했습니다.',
      catEn: 'Souls · farming',
      whyEn: 'The most compact guide to earning Souls in the new jungle.',
      takeawaysEn: [
        "If an orange light comes on at the 4th heavy melee, it's a fast Sinner's Sacrifice. Same Souls, just faster.",
        "Shooting a neutral's weak spot makes it glow yellow. Large mobs' melee attacks can be parried.",
        'Camps are denser on the Hidden King side (spread out on the Archmother side).',
        'Still, the wave comes first. Never farm only the jungle.'
      ],
      chapters: [
        ['0:32', '영혼 슬롯머신 속도 변경', "Sinner's Sacrifice speed change"],
        ['2:36', '새 정글 캠프', 'New jungle camps'],
        ['6:08', '파밍 루트 - Hidden King', 'Farming route - Hidden King'],
        ['7:20', '파밍 루트 - Archmother', 'Farming route - Archmother'],
        ['10:07', '최고의 파밍 장소', 'Best farming spots'],
        ['12:23', '마무리 팁', 'Final tips']
      ],
      takeaways: [
        '강한 근거리 공격 4번째에 주황 불이 켜지면 빠른 영혼 슬롯머신. 영혼은 같고 속도만 빠릅니다.',
        '중립 유닛 약점을 쏘면 노랗게 빛납니다. 대형 몹의 근거리 공격은 방어(패링) 가능.',
        'Hidden King 쪽 캠프가 더 촘촘합니다(Archmother 쪽은 퍼져 있음).',
        '그래도 웨이브가 1순위. 정글만 도는 파밍은 금지.'
      ]
    },
    {
      id: 'mGn4T4B4cdY',
      title: '그 누구보다 부자가 되는 방법 [데드락 가이드]',
      channel: '네크로',
      date: '2026-02-19',
      length: '12:08',
      lang: 'ko',
      cat: '영혼·파밍',
      old: '영혼 슬롯머신 위치는 9월 패치 전 맵',
      thumb: 'https://i.ytimg.com/vi/mGn4T4B4cdY/mqdefault.jpg',
      why: '라인전이 끝난 뒤(10~20분) 캐리가 무엇을 먼저 먹을지 순서대로 정리합니다.',
      titleEn: 'How to get richer than anyone [Deadlock guide]',
      channelEn: 'Necro',
      catEn: 'Souls · farming',
      oldEn: "Sinner's Sacrifice spots are on the pre-September map",
      whyEn: 'Lays out, in order, what a carry should take first after laning (10~20 min).',
      basisEn: 'the auto-generated subtitles',
      takeawaysEn: [
        'Carries (Victor · Seven · Wraith) aim to bring their power spike earlier. Supports · roamers (Paige · Paradox · Sinclair · Calico) start fights in mid-game.',
        '1st, lanes: a wave pulled back gets killed by your Guardian and its Souls are lost. Pushing forces the enemy to defend and makes your Zipline longer.',
        "2nd, Sinner's Sacrifice: from 8 min. A jackpot gives permanent stats. With mobs beside it, kill them too or it won't respawn.",
        '3rd, jungle camps: mostly small and medium. Large only with enough damage or a Cultist Sacrifice.',
        '4th, crates and Golden Statues on the way past. When ahead, enemy jungle first, your own on the way back.',
        "Don't fight while weak: even a win slows your growth. Once the spike comes, farm less and join fights."
      ],
      chapters: [
        ['0:41', '캐리와 서포터', 'Carries and supports'],
        ['2:46', '1순위 전선', '1st: lanes'],
        ['3:53', '2순위 영혼 슬롯머신', "2nd: Sinner's Sacrifice"],
        ['5:33', '옆 몹까지 처치', 'Kill the mobs beside it'],
        ['6:40', '3순위 정글 캠프', '3rd: jungle camps'],
        ['7:12', '4순위 상자·황금 조각상', '4th: crates · Golden Statues'],
        ['7:44', '상대 정글 먼저', 'Enemy jungle first'],
        ['8:17', '약할 땐 싸우지 않기', "Don't fight while weak"],
        ['9:29', '요약', 'Summary']
      ],
      chaptersMade: true,
      takeaways: [
        '캐리(빅터·세븐·레이스)는 전성기를 앞당기는 게 목표. 서포터·로머(페이지·패러독스·싱클레어·칼리코)는 중반에 싸움을 엽니다.',
        '1순위 전선: 당겨진 웨이브는 아군 가디언이 잡아 영혼이 사라짐. 밀면 상대는 수비하러 와야 하고 아군 집라인이 길어집니다.',
        '2순위 영혼 슬롯머신: 8분부터. 잭팟이면 영구 능력치. 옆에 몹이 있으면 몹까지 잡아야 리스폰.',
        '3순위 정글 캠프는 소형·중형 위주. 대형은 화력이 충분하거나 희생 제물이 있을 때만.',
        '4순위 상자·황금 조각상은 지나가는 길에. 앞서면 상대 정글 먼저, 돌아오면서 아군 정글.',
        '약할 땐 싸우지 않기. 이겨도 성장이 늦어짐. 전성기가 오면 파밍을 줄이고 싸움에 합류.'
      ],
      basis: '자동 자막 기준'
    },
    {
      id: 'xwclv0agS3A',
      title: "I'll Fix Your Deadlock Macro in 8 Minutes",
      channel: 'Natan',
      date: '2026-10-17',
      length: '8:56',
      lang: 'en',
      cat: '정글·매크로',
      why: '8분짜리 운영 요약입니다. 자동 한국어 자막이 있습니다.',
      catEn: 'Jungle · macro',
      whyEn: 'An 8-minute strategy summary. Has auto-generated Korean subtitles.',
      basisEn: 'the chapters',
      takeawaysEn: [
        'Always push waves, and move with the objective timers.',
        "Split roles between the side laners and the rest, and don't over-group."
      ],
      chapters: [
        ['0:14', '웨이브는 항상 밀기', 'Always push waves'],
        ['0:44', '오브젝트 중심 운영', 'Playing around objectives'],
        ['1:48', '크로스맵', 'Cross-map'],
        ['2:27', '기본 운영', 'Basic macro'],
        ['3:06', '사이드 라이너', 'Side laners'],
        ['6:08', '과하게 뭉치지 않기', "Don't over-group"],
        ['6:47', '파밍할 때와 싸울 때', 'When to farm, when to fight'],
        ['8:12', '후반 운영', 'Late-game macro']
      ],
      takeaways: ['웨이브는 항상 밀고, 오브젝트 타이머에 맞춰 움직입니다.', '사이드 라이너와 나머지의 역할을 나누고 과하게 뭉치지 않습니다.'],
      basis: '챕터 기준'
    },
    {
      id: 'E5CRaB37G5E',
      title: 'Why You Should STOP HOLDING W | Deadlock Movement Essentials Guide',
      channel: 'Natan',
      date: '2026-01-25',
      length: '9:41',
      lang: 'en',
      cat: '이동 기술',
      old: '원리는 유효, 일부 수치는 당시 기준',
      why: '10분 안에 이동 기본기를 전부 훑습니다.',
      catEn: 'Movement',
      oldEn: 'Principles hold; some numbers are from that time',
      whyEn: 'Covers all the movement basics in under 10 min.',
      takeawaysEn: [
        'Make sliding after every dash a habit. A Dash-Jump costs 2 Stamina, a down dash 0.5.',
        'Your first wall jump in the air uses no Stamina.',
        'In the air, release W and turn with A/D and the mouse.',
        'Practice only one technique a day.'
      ],
      chapters: [
        ['0:54', '활주(슬라이딩)', 'Slide'],
        ['1:16', '대시·공중 점프', 'Dash · air jump'],
        ['1:37', '하강 대시', 'Down dash'],
        ['2:29', '대시 점프', 'Dash-Jump'],
        ['2:52', '오르기·슈퍼글라이드', 'Mantle · superglide'],
        ['3:11', '벽 점프', 'Wall jump'],
        ['4:53', '에어 스트레이프', 'Air strafe'],
        ['5:45', '집라인', 'Ziplines'],
        ['8:40', '연습 방법', 'How to practice']
      ],
      takeaways: [
        '대시할 때마다 슬라이드를 습관화하세요. 대시 점프는 활력(스태미나) 2칸, 하강 대시는 0.5칸.',
        '공중 첫 벽 점프는 활력(스태미나)을 쓰지 않습니다.',
        '공중에서는 W를 떼고 A/D와 마우스로 방향을 꺾습니다.',
        '하루에 기술 하나씩만 연습하세요.'
      ]
    },
    {
      id: 'Ev2J92nJduY',
      title: '데드락 무브먼트 가이드 기초부터 심화까지',
      channel: 'NightMare 장욱',
      date: '2026-02-17',
      length: '10:11',
      lang: 'ko',
      cat: '이동 기술',
      old: '예시 지형은 구맵',
      why: '한국어 무빙 입문 영상. 기술 이름 표기만 주의하세요.',
      titleEn: 'Deadlock movement guide, from basics to advanced',
      channelEn: 'NightMare Janguk',
      catEn: 'Movement',
      oldEn: 'Example terrain is the old map',
      whyEn: 'A Korean intro to movement. Just mind how the technique names are written.',
      takeawaysEn: [
        'Reach a second floor with W + wall jump. If you bounce off, latch on with a heavy melee (saves Stamina over a double jump).',
        'W + crouch while mantling = mantle slide.',
        'Unless you are near the top, aim and ability use come before movement.'
      ],
      chapters: [
        ['0:19', '대시 점프 활주', 'Dash-Jump slide'],
        ['0:44', '2층 벽점·강한 근거리 공격으로 오르기', 'Second floor: wall jump · climbing with heavy melee'],
        ['1:50', '오르기 활주', 'Mantle slide'],
        ['2:19', '슈퍼 글라이딩', 'Superglide'],
        ['3:51', '코너 부스트', 'Corner boost'],
        ['5:09', '엣지 부스트', 'Edge boost'],
        ['6:37', '에어 스트레이프', 'Air strafe'],
        ['8:43', '버니합', 'Bunny hop']
      ],
      takeaways: [
        '2층은 W+벽점으로. 튕기면 강한 근거리 공격으로 붙기(더블 점프보다 활력(스태미나) 절약).',
        '오르기 중 W+앉기 = 오르기 활주.',
        '최상위권이 아니면 무빙보다 에임과 능력 활용이 먼저입니다.'
      ]
    },
    {
      id: 'NV8G-p3xzmI',
      title: "The Deadlock Item Guide: What's Actually Worth Buying",
      channel: 'Metro Deadlock',
      date: '2026-10-17',
      length: '20:18',
      lang: 'en',
      cat: '아이템',
      why: '"아이템을 샀는데 딜이 안 나온다"를 규칙 4개로 정리합니다.',
      catEn: 'Items',
      whyEn: 'Sorts out "I bought items but deal no damage" with 4 rules.',
      takeawaysEn: [
        "On the loading screen, check the enemy comp's main damage type (gun/abilities) and buy counters ahead of time.",
        'Before your first big item, put only about 4.8k into Vitality (green).',
        'The further behind you are, the fewer Vitality items; first check whether you died to bad positioning.'
      ],
      chapters: [
        ['0:46', '규칙 1: 초반 카운터', 'Rule 1: early counters'],
        ['3:00', '카운터 아이템 개요', 'Counter items overview'],
        ['5:09', '반응형 방벽은 별로', 'Reactive Barrier is weak'],
        ['8:22', '규칙 2: 초록(생명) 과다 금지', 'Rule 2: not too much green (Vitality)'],
        ['12:22', '중반 추천', 'Mid-game picks'],
        ['14:03', '규칙 3: 실수가 잘못된 구매로', 'Rule 3: mistakes turn into bad buys'],
        ['16:22', '규칙 4: 뒤처지면 초록을 줄이기', 'Rule 4: less green when behind']
      ],
      takeaways: [
        '로딩 화면에서 적 조합의 주 피해 유형(총/능력)을 보고 카운터를 미리 삽니다.',
        '첫 대형 아이템 전에는 생존(초록) 투자를 약 4.8k까지만.',
        '뒤처질수록 생명 아이템을 줄이고, 죽은 원인이 위치 선정인지부터 확인합니다.'
      ]
    }
  ]
};
