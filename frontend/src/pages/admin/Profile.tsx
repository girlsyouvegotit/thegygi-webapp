import { ProfileWorkspace } from "@/components/profile/ProfileWorkspace";

const Profile = () => (
  <ProfileWorkspace
    subtitle="Your admin account"
    roleLabel="Admin"
    variant="admin"
    tipTitle="Keep your admin identity current"
    tipBody="Upload a profile photo so activity logs and team views show the right person."
    showCategories={false}
  />
);

export default Profile;
