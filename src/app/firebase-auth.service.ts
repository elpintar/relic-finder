import { User } from './types';
import { Auth as AngularFireAuth, getAuth, signInWithPopup, onAuthStateChanged, User as FireUser, GoogleAuthProvider } from '@angular/fire/auth';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root',
})
export class FirebaseAuthService {
  user: FireUser | null = null;
  users: User[] | null = null;
  userIsEditor = false;

  constructor(
    private firestore: AngularFirestore,
    public angularFireAuth: AngularFireAuth
  ) {}

  getInitialUserData(): void {
    // Get user data if user is logged in.
    const auth: AngularFireAuth = getAuth();

    // Get updates to user data and keep it updated.
    onAuthStateChanged(auth, (user: FireUser|null) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        this.user = user;
        console.log("this.user is ", user);
        if (!this.users || this.users.length < 1) {
          // On first time, get set of authentic user ids who can write.
          this.firestore
          .collection('users')
          .get()
          .subscribe((querySnapshot) => {
            const users = querySnapshot.docs.map(doc => doc.data() as User);

            console.log('users:', users);
            this.users = users;
            this.userIsEditor = this.checkIfUserIsEditor();
            console.log('User is editor:', this.userIsEditor);
          });
        } else {
          // Update user data whenever the auth state changes.
          this.userIsEditor = this.checkIfUserIsEditor();
          console.log('After user change, user is editor:', this.userIsEditor);
        }
      } else {
        // User is signed out
        console.log("User signed out!");
      }
    });
  }

  checkIfUserIsEditor(): boolean {
    const loggedInUser = this.user;
    if (loggedInUser && this.users) {
      return this.users.findIndex((user) => user.uid === loggedInUser.uid) >= 0;
    } else {
      return false;
    }
  }

  getUserName(): string | undefined {
    const loggedInUser = this.user;
    if (loggedInUser && this.users) {
      const foundUser = this.users.find(
        (user) => user.uid === loggedInUser.uid
      );
      return foundUser ? foundUser.name : undefined;
    } else {
      return undefined;
    }
  }

  login(): void {
    const provider = new GoogleAuthProvider();

    signInWithPopup(this.angularFireAuth, provider) // Access the auth instance directly
    .then((result) => {
      console.log('Logged in with user data:', JSON.stringify(result));
    })
    .catch((error: Error) => {
      alert('Login error: ' + error.message);
    });
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.angularFireAuth.signOut();
    }
  }
}
