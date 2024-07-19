import { User } from './types';
import { getAuth, signInWithPopup, onAuthStateChanged, User as FireUser, GoogleAuthProvider } from 'firebase/auth';
import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, DocumentData } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class FirebaseAuthService {
  user: FireUser | null = null;
  users: User[] | null = null;
  userIsEditor = false;

  private firestore = inject(Firestore);

  constructor() {}

  getInitialUserData(): void {
    onAuthStateChanged(getAuth(), (user: FireUser | null) => {
      if (user) {
        this.user = user;
        console.log("this.user is", user);

        const usersCollection = collection(this.firestore, 'users');
        collectionData(usersCollection).subscribe(
          (users: DocumentData[]) => {
            // Get set of authentic user ids who can write.
            this.users = users as User[];
            this.userIsEditor = this.checkIfUserIsEditor();
          },
          (error) => {
            console.error('Error fetching users data:', error);
          }
        );
      } else {
        // User is signed out
        this.user = null;
        this.users = null;
        this.userIsEditor = false;
        console.log("User signed out!");
      }
    }, (error) => {
      // Handle errors from onAuthStateChanged
      console.error('Error in onAuthStateChanged:', error);
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

  login(callback: ()=>void): void {
    const provider = new GoogleAuthProvider();

    signInWithPopup(getAuth(), provider) // Access the auth instance directly
    .then((result) => {
      console.log('Logged in with user data:', JSON.stringify(result));
    })
    .catch((error: Error) => {
      alert('Login error: ' + error.message);
    }).finally(() => {
      callback();
    });
  }

  logout(callback: ()=>void): void {
    if (confirm('Are you sure you want to logout?')) {
      getAuth().signOut().finally(() => {
        callback();
      });
    }
  }
}
