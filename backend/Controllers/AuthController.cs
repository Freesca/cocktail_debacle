using backend.Dtos;
using backend.DTOs;
using backend.Entities;
using backend.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;




namespace backend.Controllers;


[ApiController]
[Route("auth")]

public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly IConfiguration _config;
    private readonly JwtService _jwtService;

    public AuthController(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        IConfiguration config,
        JwtService jwtService
    )
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _config = config;
        _jwtService = jwtService;
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

        return Ok(new { message = "User registered successfully." });
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
}
