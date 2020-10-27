import { Component, ViewChild } from '@angular/core';
import { PhotoInfo, Relic, ZoomArea, User } from './types';
import { CabinetSceneComponent } from './cabinet-scene/cabinet-scene.component';
import { AngularFirestore, AngularFirestoreCollection, DocumentData, DocumentReference, QuerySnapshot } from '@angular/fire/firestore';
import { bindCallback, Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase/app';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {

  user: firebase.User|null = null;
  users: User[]|null = null;
  userIsEditor = false;

  constructor(private firestore: AngularFirestore,
              public angularFireAuth: AngularFireAuth) {}

  getInitialUserData(): void {
    // Get user data if user is logged in.
    this.angularFireAuth.user.pipe(take(1)).subscribe(userResult => {
      console.log('user:', userResult);
      // Get set of authentic user ids who can write.
      this.firestore.collection<User>('users')
          .valueChanges().pipe(take(1)).subscribe((users) => {
        console.log('users:', users);
        this.user = userResult;
        this.users = users;
        this.userIsEditor = this.checkIfUserIsEditor();
      });
    });
    // Get updates to user data and keep it updated.
    this.angularFireAuth.authState.subscribe((user: firebase.User|null) => {
      // Update user data whenever the auth state changes.
      this.user = user;
      this.userIsEditor = this.checkIfUserIsEditor();
      console.log('User is editor:', this.userIsEditor);
    });
  }

  checkIfUserIsEditor(): boolean {
    const loggedInUser = this.user;
    if (loggedInUser && this.users) {
      return this.users.findIndex(user => user.uid === loggedInUser.uid) >= 0;
    } else {
      return false;
    }
  }

  login(): void {
    this.angularFireAuth.signInWithPopup(new auth.GoogleAuthProvider())
    .then((result) => {
      console.log('Logged in with user data:', JSON.stringify(result));
    }).catch((error: Error) => {
      alert('Login error: ' + error.message);
    });
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.angularFireAuth.signOut();
    }
  }
}
