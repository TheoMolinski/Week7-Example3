<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue';
import { nextTick, ref } from 'vue';

const { isAuthenticated, loginWithRedirect, logout, user, isLoading, error } =
  useAuth0();
const returnTo = window.location.origin;
const actionError = ref<string | null>(null);
const signingOut = ref(false);
const signingIn = ref(false);

async function signIn() {
  actionError.value = null;
  signingIn.value = true;
  try {
    await loginWithRedirect();
  } catch {
    actionError.value = 'Sign-in could not start. Please try again.';
    signingIn.value = false;
  }
}

async function signOut() {
  actionError.value = null;
  signingOut.value = true;
  // Dispose the product view before redirecting so restricted data is cleared.
  await nextTick();
  try {
    await logout({ logoutParams: { returnTo } });
  } catch {
    actionError.value = 'Sign-out failed. Please try again.';
    signingOut.value = false;
  }
}
</script>

<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">Products App</div>
      <div class="spacer"></div>
      <div class="auth">
        <span v-if="!isLoading && isAuthenticated && user" class="user">
          Signed in as {{ user.name || user.email }}
        </span>
        <span v-if="isLoading" role="status">Checking session…</span>
        <button
          v-else-if="!isAuthenticated"
          :disabled="signingIn"
          @click="signIn"
        >
          Sign in
        </button>
        <button v-else :disabled="signingOut" @click="signOut">Sign out</button>
      </div>
    </header>
    <main class="content">
      <p v-if="actionError || error" role="alert">
        {{
          actionError ||
          'Your sign-in session failed. Please sign in again, or sign out first if you are already signed in.'
        }}
      </p>
      <p v-if="signingOut" role="status">Signing out…</p>
      <RouterView v-else />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background: #f5f5f5;
}
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: #111827; /* gray-900 */
  color: #e5e7eb; /* gray-200 */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
.brand {
  font-weight: 600;
}
.spacer {
  flex: 1;
}
.auth {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.auth button {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
}
.auth button:hover {
  background: #1d4ed8;
}
.user {
  margin-right: 0.5rem;
  font-size: 0.9rem;
  opacity: 0.9;
}
.content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}
</style>
