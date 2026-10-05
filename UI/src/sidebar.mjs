// Project already-eligible metadata without changing the financial model.
export function projectSidebar(nodes, section, expanded = new Set()) {
  return nodes.flatMap(node => {
    const children = projectSidebar(node.children, section, expanded);
    const category = ['INCOME','EXPENSE'].includes(node.type);
    // Promote children when their parent belongs to the other list.
    if (category !== (section === 'categories')) return children;
    return [{...node,children,isOpen:expanded.has(node.id)}];
  });
}
