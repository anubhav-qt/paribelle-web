import ThemeRenderer from '@/components/ThemeRenderer';
import CategoryNav from '@/components/CategoryNav';
import ProfileContent from '@/components/ProfileContent';

export default function ProfilePage() {

  return (
    <div className="min-h-screen bg-background">
      <ThemeRenderer component="header" showLocationFilter={false} showBookingsLink={true} />
      <CategoryNav mode="navigation" />
      <ProfileContent />
    </div>
  );
}
