
package com.gestionmicroempresas.backend.seguridad;

import com.gestionmicroempresas.backend.servicios.TokenServicio;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SeguridadConfiguracion {

    @Bean
    public PasswordEncoder codificadorContrasenas() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public SecurityFilterChain filtroSeguridad(
            HttpSecurity http,
            ConvertidorAutenticacionJwt convertidorJwt
    ) throws Exception {

        http
                .cors(cors -> cors.configurationSource(
                        configuracionCors()
                ))

                .csrf(csrf -> csrf
                        .csrfTokenRepository(
                                CookieCsrfTokenRepository.withHttpOnlyFalse()
                        )
                        .csrfTokenRequestHandler(
                                new CsrfTokenRequestAttributeHandler()
                        )
                )

                .sessionManagement(session -> session
                        .sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(autorizacion -> autorizacion

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/autenticacion/csrf"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/autenticacion/registrar-empresa",
                                "/api/autenticacion/iniciar-sesion",
                                "/api/autenticacion/cerrar-sesion"
                        ).permitAll()

                        .requestMatchers(
                                "/api/usuarios/empleados"
                        ).hasRole("ADMIN")

                        .anyRequest().authenticated()
                )

                .oauth2ResourceServer(oauth2 -> oauth2

                        .bearerTokenResolver(
                                this::extraerTokenDeCookie
                        )

                        .jwt(jwt -> jwt
                                .jwtAuthenticationConverter(
                                        convertidorJwt
                                )
                        )
                )

                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable);

        return http.build();
    }

    private String extraerTokenDeCookie(
            HttpServletRequest solicitud
    ) {

        String ruta = solicitud.getServletPath();

        // Estas rutas no necesitan autenticar un JWT.
        // Tambien deben funcionar si existe una
        // cookie de sesion caducada.

        if (
                ruta.equals("/api/autenticacion/csrf") ||
                        ruta.equals("/api/autenticacion/registrar-empresa") ||
                        ruta.equals("/api/autenticacion/iniciar-sesion") ||
                        ruta.equals("/api/autenticacion/cerrar-sesion")
        ) {
            return null;
        }

        Cookie[] cookies = solicitud.getCookies();

        if (cookies == null) {
            return null;
        }

        return Arrays.stream(cookies)
                .filter(cookie ->
                        TokenServicio.NOMBRE_COOKIE.equals(
                                cookie.getName()
                        )
                )
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    @Bean
    public CorsConfigurationSource configuracionCors() {

        CorsConfiguration configuracion =
                new CorsConfiguration();

        configuracion.setAllowedOrigins(
                List.of("http://localhost:3000")
        );

        configuracion.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );

        configuracion.setAllowedHeaders(
                List.of(
                        "Content-Type",
                        "Accept",
                        "Authorization",
                        "X-XSRF-TOKEN"
                )
        );

        configuracion.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource origen =
                new UrlBasedCorsConfigurationSource();

        origen.registerCorsConfiguration(
                "/api/**",
                configuracion
        );

        return origen;
    }
}
