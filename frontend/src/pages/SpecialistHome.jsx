import { ChildrenList } from './ChildrenList.jsx';

export default function SpecialistHome() {
  return (
    <ChildrenList
      title="Bağlı olduğum çocuklar"
      intro="Sadece ebeveynin sizi bağladığı çocukları görürsünüz."
      emptyTitle="Henüz bağlı bir çocuk yok"
      emptyText="Bir ebeveyn sizi e-posta adresinizle eklediğinde çocuk burada görünür."
    />
  );
}
