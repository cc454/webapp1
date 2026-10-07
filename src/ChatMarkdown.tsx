import React, { useMemo } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import MarkdownIt from 'markdown-it';
import Token from 'markdown-it/lib/token.mjs';
import { colors, s } from './ui';

const parser = new MarkdownIt({ html: false, linkify: true, breaks: true });
type Node = { token: Token; children: Node[] };
function tree(tokens: Token[]): Node[] {
  const roots: Node[] = [], stack = [roots];
  for (const token of tokens) {
    if (token.nesting === -1) { stack.pop(); continue; }
    const node = { token, children: token.children ? tree(token.children) : [] };
    stack[stack.length - 1]!.push(node);
    if (token.nesting === 1) stack.push(node.children);
  }
  return roots;
}
export function safeChatLink(url: string): boolean { return /^(https?:\/\/|mailto:)/i.test(url); }
function inline(nodes: Node[]): React.ReactNode[] {
  return nodes.map(({ token: t, children }, i) => {
    if (t.type === 'softbreak' || t.type === 'hardbreak') return '\n';
    if (t.type === 'text') return t.content;
    if (t.type === 'image') return <Text key={i}>[Image: {t.content}]</Text>;
    if (t.type === 'code_inline') return <Text key={i} style={{ fontFamily: 'monospace', backgroundColor: colors.bg }}>{t.content}</Text>;
    if (t.type === 'link_open') {
      const href = t.attrGet('href') ?? '';
      return <Text key={i} accessibilityRole={safeChatLink(href) ? 'link' : undefined} onPress={safeChatLink(href) ? () => { void Linking.openURL(href).catch(() => {}); } : undefined} style={{ color: colors.accent, textDecorationLine: 'underline' }}>{inline(children)}</Text>;
    }
    return <Text key={i} style={t.type === 'strong_open' ? { fontWeight: '700' } : t.type === 'em_open' ? { fontStyle: 'italic' } : t.type === 's_open' ? { textDecorationLine: 'line-through' } : undefined}>{children.length ? inline(children) : t.content}</Text>;
  });
}
function blocks(nodes: Node[]): React.ReactNode[] {
  return nodes.map(({ token: t, children }, i) => {
    if (t.type === 'inline') return <Text key={i} selectable style={s.body}>{inline(children)}</Text>;
    if (t.type === 'heading_open') return <Text key={i} selectable accessibilityRole="header" style={[s.heading, { fontSize: t.tag === 'h1' ? 24 : t.tag === 'h2' ? 21 : 18 }]}>{children.flatMap(n => n.token.type === 'inline' ? inline(n.children) : inline([n]))}</Text>;
    if (t.type === 'fence' || t.type === 'code_block') return <ScrollView key={i} horizontal style={{ backgroundColor: colors.bg, borderRadius: 8 }}><Text selectable style={[s.body, { fontFamily: 'monospace', padding: 12 }]}>{t.content.trimEnd()}</Text></ScrollView>;
    if (t.type === 'hr') return <View key={i} style={{ height: 1, backgroundColor: colors.edge, marginVertical: 6 }} />;
    if (t.type === 'bullet_list_open' || t.type === 'ordered_list_open') {
      const start = Number(t.attrGet('start') ?? 1);
      return <View key={i} style={{ gap: 8 }}>{children.map((item, j) => <View key={j} style={{ flexDirection: 'row', gap: 8 }}><Text style={s.body}>{t.type === 'ordered_list_open' ? `${start + j}.` : '•'}</Text><View style={{ flex: 1, gap: 6 }}>{blocks(item.children)}</View></View>)}</View>;
    }
    if (t.type === 'blockquote_open') return <View key={i} style={{ borderLeftWidth: 3, borderLeftColor: colors.accent, paddingLeft: 12, gap: 8 }}>{blocks(children)}</View>;
    if (t.type === 'table_open') return <ScrollView key={i} horizontal><View>{blocks(children)}</View></ScrollView>;
    if (t.type === 'tr_open') return <View key={i} style={{ flexDirection: 'row' }}>{blocks(children)}</View>;
    if (t.type === 'th_open' || t.type === 'td_open') return <View key={i} style={{ width: 160, padding: 8, borderWidth: 1, borderColor: colors.edge }}>{blocks(children)}</View>;
    return <View key={i} style={{ gap: 8 }}>{children.length ? blocks(children) : <Text selectable style={s.body}>{t.content}</Text>}</View>;
  });
}
export function ChatMarkdown({ content }: { content: string }) {
  const nodes = useMemo(() => tree(parser.parse(content, {})), [content]);
  return <View style={{ gap: 12 }}>{blocks(nodes)}</View>;
}
