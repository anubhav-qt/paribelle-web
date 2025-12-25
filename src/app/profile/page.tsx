import Header from '@/components/Header';
import CategoryNav from '@/components/CategoryNav';
import ProfileContent from '@/components/ProfileContent';

export default function ProfilePage() {

  return (
    <div className="min-h-screen bg-background">
      <Header showLocationFilter={false} showBookingsLink={true} />
      <CategoryNav mode="navigation" />
      <ProfileContent />
    </div>
  );
}
