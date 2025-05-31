import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from 'app/core/auth/account.service';
import { User } from 'app/core/auth/account.model';

@Component({
  imports: [],
  template: ` <div *jhiHasAnyAuthority="'ROLE_ADMIN'" #content></div> `,
})
class TestHasAnyAuthorityDirectiveComponent {
  content = viewChild<ElementRef>('content');
}

jest.mock('app/core/auth/account.service');
jest.mock('app/core/auth/keycloak.service', () => {
  const { MockKeycloakService } = jest.requireActual('app/core/auth/keycloak.service.mock');
  return {
    keycloakService: new MockKeycloakService(),
  };
});

describe('HasAnyAuthorityDirective tests', () => {
  let mockAccountService: AccountService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TestHasAnyAuthorityDirectiveComponent, TranslateModule.forRoot()],
      providers: [provideHttpClient(), AccountService],
    });
  }));

  beforeEach(() => {
    mockAccountService = TestBed.inject(AccountService);
    mockAccountService.loaded = signal(true);
    mockAccountService.user = signal<User | undefined>(undefined);
  });

  describe('set jhiHasAnyAuthority', () => {
    it('should show restricted content to user if user has required role', () => {
      // GIVEN
      mockAccountService.hasAnyAuthority = jest.fn(() => true);
      const fixture = TestBed.createComponent(TestHasAnyAuthorityDirectiveComponent);
      const comp = fixture.componentInstance;

      // WHEN
      fixture.detectChanges();

      // THEN
      expect(comp.content).toBeDefined();
    });

    it('should not show restricted content to user if user has not required role', () => {
      // GIVEN
      mockAccountService.hasAnyAuthority = jest.fn(() => false);
      const fixture = TestBed.createComponent(TestHasAnyAuthorityDirectiveComponent);
      const comp = fixture.componentInstance;

      // WHEN
      fixture.detectChanges();

      // THEN
      expect(comp.content()).toBeUndefined();
    });
  });
  // TODO: fix this test in follow-up PR
  /*
      describe('change authorities', () => {
        it('should show or not show restricted content correctly if user authorities are changing', () => {
          // GIVEN
          mockAccountService.hasAnyAuthority = jest.fn((): boolean => Boolean(currentAccount()));
          const fixture = TestBed.createComponent(TestHasAnyAuthorityDirectiveComponent);
          const comp = fixture.componentInstance;
    
          // WHEN
          fixture.detectChanges();
    
          // THEN
          expect(comp.content()).toBeDefined();
    
          // GIVEN
          currentAccount.set(null);
    
          // WHEN
          fixture.detectChanges();
    
          // THEN
          expect(comp.content()).toBeUndefined();
    
          // WHEN
          currentAccount.set({ activated: true, authorities: ['foo'] } as any);
          fixture.detectChanges();
    
          // THEN
          expect(comp.content).toBeDefined();
        });
      });*/
});
