package com.knowledgehub.service;

import com.knowledgehub.dto.request.LoginRequest;
import com.knowledgehub.dto.request.RegisterRequest;
import com.knowledgehub.dto.response.AuthResponse;
import com.knowledgehub.entity.User;
import com.knowledgehub.repository.UserRepository;
import com.knowledgehub.security.JwtUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Tests for the account enumeration fix in AuthService.
 *
 * The vulnerability: returning specific messages like "Email already registered"
 * or "Username already taken" lets attackers enumerate which accounts exist.
 * The fix: always return the same generic message for ALL registration failures.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AuthService ??? account enumeration prevention tests")
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private UserDetailsService userDetailsService;

    @InjectMocks
    private AuthService authService;

    // ????????? Account enumeration fix ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

    @Test
    @DisplayName("SECURITY: taken username returns generic message ??? does NOT reveal 'username taken'")
    void takenUsername_returnsGenericMessage_notSpecific() {
        RegisterRequest req = registerRequest("existingUser", "new@email.com", "password123");
        when(userRepository.existsByUsername("existingUser")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Registration failed. Please check your details and try again.")
                // Critical: must NOT say "username" or "taken" ??? that reveals information
                .hasMessageNotContaining("username")
                .hasMessageNotContaining("taken")
                .hasMessageNotContaining("already");
    }

    @Test
    @DisplayName("SECURITY: taken email returns generic message ??? does NOT reveal 'email registered'")
    void takenEmail_returnsGenericMessage_notSpecific() {
        RegisterRequest req = registerRequest("newUser", "existing@email.com", "password123");
        when(userRepository.existsByUsername("newUser")).thenReturn(false);
        when(userRepository.existsByEmail("existing@email.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Registration failed. Please check your details and try again.")
                // Must NOT say "email" or "registered" ??? attacker could probe all emails
                .hasMessageNotContaining("email")
                .hasMessageNotContaining("registered")
                .hasMessageNotContaining("already");
    }

    @Test
    @DisplayName("SECURITY: both username and email taken return THE SAME message (indistinguishable)")
    void usernameAndEmailConflict_returnIdenticalMessage() {
        RegisterRequest req1 = registerRequest("takenUser", "other@email.com", "pass");
        when(userRepository.existsByUsername("takenUser")).thenReturn(true);

        RegisterRequest req2 = registerRequest("newUser", "taken@email.com", "pass");
        when(userRepository.existsByUsername("newUser")).thenReturn(false);
        when(userRepository.existsByEmail("taken@email.com")).thenReturn(true);

        String msg1 = null, msg2 = null;
        try { authService.register(req1); } catch (IllegalArgumentException e) { msg1 = e.getMessage(); }
        try { authService.register(req2); } catch (IllegalArgumentException e) { msg2 = e.getMessage(); }

        // Both failures produce the exact same message ??? attacker cannot distinguish them
        assertThat(msg1).isEqualTo(msg2);
    }

    // ????????? Happy path ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

    @Test
    @DisplayName("Successful registration saves user and returns tokens")
    void successfulRegistration_savesUserAndReturnsTokens() {
        RegisterRequest req = registerRequest("brandNewUser", "brand@new.com", "securePass1");
        when(userRepository.existsByUsername("brandNewUser")).thenReturn(false);
        when(userRepository.existsByEmail("brand@new.com")).thenReturn(false);
        when(passwordEncoder.encode("securePass1")).thenReturn("$2a$12$hashedPassword");

        User savedUser = User.builder()
                .username("brandNewUser")
                .email("brand@new.com")
                .password("$2a$12$hashedPassword")
                .build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("brandNewUser");
        when(userDetailsService.loadUserByUsername("brandNewUser")).thenReturn(userDetails);
        when(jwtUtil.generateAccessToken(userDetails)).thenReturn("access.token.here");
        when(jwtUtil.generateRefreshToken(userDetails)).thenReturn("refresh.token.here");

        AuthResponse response = authService.register(req);

        assertThat(response.getAccessToken()).isEqualTo("access.token.here");
        assertThat(response.getRefreshToken()).isEqualTo("refresh.token.here");
        verify(userRepository).save(any(User.class));
    }

    // ????????? Login tests ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

    @Test
    @DisplayName("Login with valid credentials succeeds")
    void loginWithValidCredentials_succeeds() {
        LoginRequest req = new LoginRequest();
        req.setUsername("validUser");
        req.setPassword("correctPass");

        User user = User.builder().username("validUser").email("u@e.com").password("hashed").build();
        when(userRepository.findByUsername("validUser")).thenReturn(Optional.of(user));

        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("validUser");
        when(userDetailsService.loadUserByUsername("validUser")).thenReturn(userDetails);
        when(jwtUtil.generateAccessToken(userDetails)).thenReturn("access.jwt");
        when(jwtUtil.generateRefreshToken(userDetails)).thenReturn("refresh.jwt");

        AuthResponse response = authService.login(req);

        assertThat(response.getAccessToken()).isEqualTo("access.jwt");
    }

    @Test
    @DisplayName("Login with wrong password throws exception")
    void loginWithWrongPassword_throws() {
        LoginRequest req = new LoginRequest();
        req.setUsername("user");
        req.setPassword("wrongPass");

        doThrow(new BadCredentialsException("Bad credentials"))
                .when(authenticationManager)
                .authenticate(any(UsernamePasswordAuthenticationToken.class));

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BadCredentialsException.class);
    }

    // ????????? Helper ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

    private RegisterRequest registerRequest(String username, String email, String password) {
        RegisterRequest req = new RegisterRequest();
        req.setUsername(username);
        req.setEmail(email);
        req.setPassword(password);
        return req;
    }
}
