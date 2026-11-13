import { ChildrenList } from './ChildrenList.jsx';

export default function ParentHome() {
  return (
    <ChildrenList
      title="Çocuklarım"
      intro="Takvim, görevler ve uzmanlar için bir çocuk seçin."
      emptyTitle="Kayıtlı çocuk yok"
      emptyText="Hesabınıza bağlı bir çocuk profili bulunmuyor."
    />
  );
}
