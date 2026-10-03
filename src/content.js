export const profile = {
  name: 'Ruyue',
  logo: 'R.',
  tagline: 'Research And Work Persistently, Just For A Better World',
  statement: '让幻想编译成功',
  timeline: ['山东大学 · 计算机科学 · 2024–2028', '华为 · AI Infra 工程实习 · 2026.07–2026.12'],
  email: 'SDU502329871@163.com',
  location: '地球 · 一块亮到凌晨的屏幕',
}

export const nav = [
  { label: '关于', href: '#about' },
  { label: '作品', href: '#works' },
  { label: '游戏', href: '#playground' },
  { label: '联系', href: '#contact' },
]

export const stats = [
  { value: 'C++', label: '最顺手的语言' },
  { value: 'Minecraft', label: '玩了最久的游戏' },
  { value: '钢琴', label: '另一块键盘' },
]

export const skills = ['C++', 'Python', 'Golang', 'MySQL', 'Redis', '高并发', '算子调优', '分布式训练']

export const works = [
  {
    title: '星轨',
    en: 'STAR TRAIL',
    year: '2025',
    sketch: 'star',
    desc: '用 Three.js 渲染的动态博客，滚动条就是摄影机轨道。',
    tags: ['WebGL', 'React'],
  },
  {
    title: '回声',
    en: 'ECHO',
    year: '2024',
    sketch: 'echo',
    desc: '实时协作白板，每一笔都是粒子系统，撤销等于时间回溯。',
    tags: ['Canvas', 'WebSocket'],
  },
  {
    title: '浮游',
    en: 'DRIFT',
    year: '2024',
    sketch: 'drift',
    desc: '住在桌面角落的 Electron 电子宠物，有自己的寻路算法。',
    tags: ['Electron', '动画'],
  },
  {
    title: '噪声',
    en: 'NOISE',
    year: '2023',
    sketch: 'noise',
    desc: '生成艺术实验集，换一个随机种子，就长出一整个宇宙。',
    tags: ['GLSL', '生成艺术'],
  },
]

export const quotes = [
  '先让它跑起来，再让它跑得漂亮。',
  '本地跑通之前，一切都只是猜想。',
  '能自动化的，绝不手动做第二次。',
  '命名和缓存失效，是编程里最难的两件事。',
  '任何足够复杂的 bug，都有一行日志在等你。',
  '所有的魔法都有源码，只是你还没读到。',
  '深夜的终端，是程序员的篝火。',
  'It works on my machine.',
]

/* 游戏专区 */
export const arcade = {
  speakers: ['深夜的终端', '路过的 NPC', '篝火旁的老程序员', '街机厅老板', '第二玩家', '加载画面'],
  // 背景视频（public/bg/arcade-bg.mp4，无缝循环 9.4s）
  bg: { src: '/bg/arcade-bg.mp4' },
}

export const achievements = [
  { id: 'fireworks', name: '烟花师', hint: '释放一次烟花', fx: 'fx-glitch' },
  { id: 'philosopher', name: '哲学家', hint: '抽取一条灵感', fx: 'fx-scramble' },
  { id: 'easter', name: '彩蛋猎人', hint: '输入传说中的秘技', fx: 'fx-shine' },
  { id: 'operator', name: '键盘侠', hint: '唤出命令面板', fx: 'fx-flip' },
  { id: 'regular', name: '二周目', hint: '再次回到这里', fx: 'fx-neon' },
]

/* 联系方式 */
export const contacts = [
  { label: 'WECHAT', value: '_SDU1015' },
  { label: 'QQ', value: '16090938746' },
]

// 填入你的真实主页后，联系区会自动展示，例如：
// { label: 'GitHub', href: 'https://github.com/<username>' }
export const socials = []
