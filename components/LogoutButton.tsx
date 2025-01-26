export default function LogoutButton() {
  return (
    <form action="/auth/sign-out" method="post">
      <button className="py-2 px-4 font-mono rounded-md no-underline border-none bg-white/50 hover:bg-white/80 mr-4">
        Logout
      </button>
    </form>
  );
}
