import Messages from "./messages";

export default function Login() {
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      <img
        src="https://cdn.pixabay.com/photo/2021/11/26/17/26/desert-6826299_1280.jpg"
        className="absolute top-0 left-0 w-full h-full bg-cover object-cover z-0"
      />
      <div className="relative z-10">
        <form
          className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground bg-white/50 rounded-lg p-8 backdrop-blur-sm"
          action="/auth/sign-in"
          method="post"
        >
          <label className="text-md" htmlFor="email">
            Email
          </label>
          <input
            className="rounded-md px-4 py-2 bg-inherit border mb-6"
            name="email"
            placeholder="you@example.com"
            required
          />
          <label className="text-md" htmlFor="password">
            Password
          </label>
          <input
            className="rounded-md px-4 py-2 bg-inherit border mb-6"
            type="password"
            name="password"
            placeholder="••••••••"
            required
          />
          <button className="bg-black hover:opacity-60 rounded-full px-4 py-2 text-white mb-2">
            Sign In
          </button>
          <button
            formAction="/auth/sign-up"
            className="border border-gray-700 hover:opacity-60 rounded-full px-4 py-2 text-black mb-2"
          >
            Sign Up
          </button>
          <Messages />
        </form>
      </div>
    </div>
  );
}
