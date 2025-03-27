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
[Route("auth")]
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
        return Ok(new { token });
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
        var result = await HttpContext.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);

        if (!result.Succeeded)
            return Unauthorized(new { message = "Google authentication failed." });

        var claims = result.Principal?.Identities?.FirstOrDefault()?.Claims;

        var email = claims?.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
        var name = claims?.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;

        if (email == null)
            return BadRequest(new { message = "Email not found in Google response." });

        var user = await _userManager.FindByEmailAsync(email);

        if (user == null)
        {
            var ValidUserName = await _userNameService.GenerateValidUserNameAsync(name, email);
            user = new User { UserName = ValidUserName, Email = email };
            var createUserResult = await _userManager.CreateAsync(user);

            if (!createUserResult.Succeeded)
                return BadRequest(createUserResult.Errors);
        }

        var token = _jwtService.GenerateToken(user);
        return Ok(new { token });
    }
}
