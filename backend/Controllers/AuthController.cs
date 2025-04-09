using backend.Dtos;
using backend.DTOs;
using backend.Entities;
using backend.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.Google;

namespace backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly IConfiguration _config;
    private readonly JwtService _jwtService;
    private readonly UserNameService _userNameService;

    public AuthController(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        IConfiguration config,
        JwtService jwtService,
        UserNameService userNameService
    )
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _config = config;
        _jwtService = jwtService;
        _userNameService = userNameService;
    }

    // POST /auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = new User
        {
            UserName = dto.Username,
            Email = dto.Email
        };

        var result = await _userManager.CreateAsync(user, dto.Password);

        if (!result.Succeeded)
            return BadRequest(result.Errors);

        var token = _jwtService.GenerateToken(user);
        return Ok(new { token });
    }

    // POST /auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await _userManager.FindByNameAsync(dto.UsernameOrEmail)
                   ?? await _userManager.FindByEmailAsync(dto.UsernameOrEmail);

        if (user == null)
            return Unauthorized(new { message = "Invalid credentials." });

        var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, false);

        if (!result.Succeeded)
            return Unauthorized(new { message = "Invalid credentials." });

        var token = _jwtService.GenerateToken(user);
        SetJwtCookie(token);
        return Ok(new { message = "Login successful" });

    }

    // GET /auth/google-login
    [HttpGet("google-login")]
    public IActionResult GoogleLogin()
    {
        var redirectUrl = Url.Action(nameof(GoogleResponse), "Auth");
        var properties = _signInManager.ConfigureExternalAuthenticationProperties(GoogleDefaults.AuthenticationScheme, redirectUrl);
        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    // GET /auth/google-response
    [HttpGet("google-response")]
    public async Task<IActionResult> GoogleResponse()
    {
        // Estrarre informazioni dal token di Google
        var result = await HttpContext.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);

        if (!result.Succeeded)
            return Unauthorized(new { message = "Google authentication failed." });

        var claims = result.Principal?.Identities?.FirstOrDefault()?.Claims;
        var email = claims?.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
        var name = claims?.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;

        if (email == null)
            return BadRequest(new { message = "Email not found in Google response." });

        // Creazione dell'utente se non esiste
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            var validUserName = await _userNameService.GenerateValidUserNameAsync(name, email);
            user = new User { UserName = validUserName, Email = email };
            var createUserResult = await _userManager.CreateAsync(user);

            if (!createUserResult.Succeeded)
                return BadRequest(createUserResult.Errors);
        }

        // Generazione di un token JWT personalizzato per il tuo sistema
        var token = _jwtService.GenerateToken(user);

        // Salvataggio del token nel cookie HttpOnly
        SetJwtCookie(token);

        return Ok(new { message = "Authenticated", token });
    }

    private void SetJwtCookie(string token)
    {
        var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.Lax,
                Secure = false, // solo in HTTPS
                Expires = DateTime.UtcNow.AddDays(7)
            };
        Response.Cookies.Append("jwt", token, cookieOptions);
    }

    [HttpGet("is-logged-in")]
    public IActionResult IsLoggedIn()
    {
        var jwt = Request.Cookies["jwt"];

        if (string.IsNullOrEmpty(jwt))
            return Unauthorized();

        var principal = _jwtService.ValidateToken(jwt);

        if (principal == null)
            return Unauthorized();

        return Ok(new { message = "Authenticated" });
    }

    [HttpGet("me")]
    public IActionResult Me()
    {
        var jwt = Request.Cookies["jwt"];

        if (string.IsNullOrEmpty(jwt))
            return Unauthorized();

        var principal = _jwtService.ValidateToken(jwt);

        if (principal == null)
            return Unauthorized();

        var username = principal.Identity?.Name;
        return Ok(new { username });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("jwt");
        return Ok(new { message = "Logout successful" });
    }
}