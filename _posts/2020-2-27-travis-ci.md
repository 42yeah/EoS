---
layout: post
title: Using Travis CI to Build C++ Code On Windows Using CMake and NMake Then Releasing Them
featured: /assets/randy-fath-ymf4_9Y9S_A-unsplash.jpg
---

Man, I can't believe I had __fun__ with this all day. (Actually it wasn't fun at all.)

## Introduction

As I am only using a macOS at home, and I don't really have a Windows to compile my stuffs into Windows executable, I am starting to look for a CI service to help me do that. And there it is: [Travis CI](https://travis-ci.community/). Nice documents, free for open source projects, GitHub Student Packs goodies, etc. I am so using it!

## Building

First of all, of course, is to register an account at [Travis CI](https://travis-ci.community/). Now that's easy! After that, the real fun comes. Together with my __extremely slow network__ recently, what should be half an hour costed me an entire afternoon. Anyway let's begin!

First, Travis CI builds based on a file, namely `.travis.yml`. And to compile C++ code, we should start the file with:

```yml
language: cpp
```

Now, I am trying to use the VS C++ compile tools, not the MinGW one (because they comes with way too much DLLs). However it turns out that they are available, yes, but they aren't in the `PATH` variable. That's right. You can however, add it manually, or use a script, like me. So now, here's my whole `.travis.yml`, and I will explain it later. For you, dear visitor, and for the future me.

```yml
language: cpp
compiler: cl # Perhaps really not necessary
os: windows
script:
    - source ./run_command_and_apply_environment_differences.sh "call vcvars64_vs2017.bat"
    - mkdir build
    - cd build
    - cmake -G "NMake Makefiles" .. # We use nmake, because that's available
    - nmake all
    - 7z a <artifact name>.zip <artifact path> # Zip the artifact (along with the dependencies, in order to use in automated releases later.)
    - ls # Checkout the build directory; what is inside?
```

Everything's clear now except the `source` part. Simply put, those are the scripts I downloaded directly from the Internet so that we could import the VC variables. And here they are!

### `run_command_and_apply_environment_differences.sh`:

```sh
# Run a command via CMD, and apply any environment difference in the CMD environment state to Git Bash
#
# This is useful when you run a batch file which modifies environment variables,
#  and you want these changes reflected within the current Git Bash session
#
# How to use:
#
# ./run_command_and_apply_environment_differences.sh "call mybatchfile.bat"

old_env_filename="$(mktemp)"
cmd //C "set > $(cygpath -w $old_env_filename)"
new_env_filename="$(mktemp)"
cmd //C "$1 && set > $(cygpath -w $new_env_filename)"
old_env=$(<$old_env_filename)
new_env=$(<$new_env_filename)

########## Analyze differences in environment strings, except path ###############

# Convert old environment to associative array

declare -A env_old
env_old=()

IFS=$'\r'
while read -r line; do
    IFS="="
    read -r var name <<< "$line"
    unset IFS
    env_old["$var"]="$name"
    IFS=$'\r'
done <<< "$old_env"
unset IFS

# Convert new environment to associative array

declare -A env_new
env_new=()

IFS=$'\r'
while read -r line; do
    IFS="="
    read -r var name <<< "$line"
    unset IFS
    env_new["$var"]="$name"
    IFS=$'\r'
done <<< "$new_env"
unset IFS

## HACK
#
#env_old["PATH"]="${env_new[PATH]};C:\Program Files (x86)\smurf;C:\Program Files (x86)\apa\bin"
#env_new["PATH"]="${env_new[PATH]};C:\Program Files (x86)\kaka;C:\Program Files (x86)\smurf"

# Locate env variables (except for path) that are added or changed from env_old to env_new

declare -A env_changes
env_changes=()
for env_key in "${!env_new[@]}"; do
    if [[ $env_key != PATH ]]; then
        if [[ -z ${env_old[$env_key]+dummy} ]]; then
            env_changes["$env_key"]="${env_new[$env_key]}"
        else
            if [ "${env_old[$env_key]}" != "${env_new[$env_key]}" ]; then
                env_changes["$env_key"]="${env_old[$env_key]}"
            fi
        fi
    fi
done

# Locate env variables (except for path) that are deleted from env_old to env_new

declare -A env_deletions
env_deletions=()
for env_key in "${!env_old[@]}"; do
    if [[ $env_key != PATH ]]; then
        if [[ -z ${env_new[$env_key]+dummy} ]]; then
            env_deletions["$env_key"]="1"
        fi
    fi
done

########## Analyze differences in path entries ###############

# Convert old path to associative array, where each entry has key = path, value = "1"
# Duplicate entries will be merged

IFS=";"
declare -a old_path_windows_array
old_path_windows_array=()
read -r -a old_path_windows_array <<< "${env_old["PATH"]}"
unset IFS

declare -A old_path_windows
old_path_windows=()
for path in "${old_path_windows_array[@]}"; do
    old_path_windows["$path"]="1"
done

# Convert new path to associative array, where each entry has key = path, value = "1"
# Duplicate entries will be merged

IFS=";"
declare -a new_path_windows_array
new_path_windows_array=()
read -r -a new_path_windows_array <<< "${env_new["PATH"]}"
unset IFS

declare -A new_path_windows
new_path_windows=()
for path in "${new_path_windows_array[@]}"; do
    new_path_windows["$path"]="1"
done

# Locate path entries that are added from old path to new path

declare -A path_additions_windows
path_additions_windows=()
for path in "${!new_path_windows[@]}"; do
    if [[ -z ${old_path_windows[$path]+dummy} ]]; then
        path_additions_windows["$path"]="1"
    fi
done

# Locate path entries that are removed from old path to new path

declare -A path_deletions_windows
path_deletions_windows=()

for path in "${!old_path_windows[@]}"; do
    if [[ -z ${new_path_windows[$path]+dummy} ]]; then
        path_deletions_windows["$path"]="1"
    fi
done

# Translate path additions from Windows format to Cygwin format

declare -A path_additions_cygwin
path_additions_cygwin=()
for path_windows in "${!path_additions_windows[@]}"; do
    path_additions_cygwin["$(cygpath "$path_windows")"]="1"
done

# Translate path deletions from Windows format to Cygwin format

declare -A path_deletions_cygwin
path_deletions_cygwin=()
for path_windows in "${!path_deletions_windows[@]}"; do
    path_deletions_cygwin["$(cygpath "$path_windows")"]="1"
done

# Convert current path to linear array

declare -a current_path_cygwin
current_path_cygwin=()

IFS=":"
read -r -a current_path_cygwin <<< "$PATH"
unset IFS

# Updated path = additions, followed by current path, excluding deletions

declare -a updated_path_cygwin
updated_path_cygwin=()
for path in "${!path_additions_cygwin[@]}"; do
    updated_path_cygwin+=("$path")
done

for path in "${current_path_cygwin[@]}"; do
    if [[ -z "${path_deletions_cygwin[$path]+dummy}" ]]; then
        updated_path_cygwin+=("$path")
    fi
done

# Convert updated path to a single string

updated_path=""
for index in "${!updated_path_cygwin[@]}"; do
    if [[ $index -ne 0 ]]; then
        updated_path+=":"
    fi
    updated_path+="${updated_path_cygwin[$index]}"
done

############### Print results ######################

#echo "env_changes: ${#env_changes[@]} items"
#for index in "${!env_changes[@]}"; do echo "${index}=${env_changes[$index]}"; done
#
#echo "env_deletions: ${#env_deletions[@]} items"
#for index in "${!env_deletions[@]}"; do echo "delete $index"; done
#
#echo "path_additions_windows: ${#path_additions_windows[@]} items"
#for index in "${!path_additions_windows[@]}"; do echo "add $index"; done
#
#echo "path_deletions_windows: ${#path_deletions_windows[@]} items"
#for index in "${!path_deletions_windows[@]}"; do echo "delete $index"; done
#
#echo "path_additions_cygwin: ${#path_additions_cygwin[@]} items"
#for index in "${!path_additions_cygwin[@]}"; do echo "add $index"; done
#
#echo "path_deletions_cygwin: ${#path_deletions_cygwin[@]} items"
#for index in "${!path_deletions_cygwin[@]}"; do echo "delete $index"; done
#
#echo "current_path_cygwin: ${#current_path_cygwin[@]} items"
#for index in "${!current_path_cygwin[@]}"; do echo "${index}: ${current_path_cygwin[$index]}"; done
#
#echo "updated_path_cygwin: ${#updated_path_cygwin[@]} items"
#for index in "${!updated_path_cygwin[@]}"; do echo "${index}: ${updated_path_cygwin[$index]}"; done
#
#echo "updated_path:"
#echo "$updated_path"

############### Apply environment & path changes ######################

# Apply env changes

for env_var in "${!env_changes[@]}"; do
    export "$env_var"="${env_changes[$env_var]}"
#    echo "$env_var"="${env_changes[$env_var]}"
done

# Apply env deletions

for env_var in "${!env_deletions[@]}"; do
    unset "$env_var"
#    echo "unsetting $env_var"
done

# Apply new PATH

#echo "Path before: $PATH"
export PATH="$updated_path"
#echo "Path after: $PATH"
```

### `vcvars64_vs2017.bat`:

```bat
:start
@call :GetVS150Dir
@if "%VS150DIR%"=="" goto error_no_VS150DIR

@call "%VS150DIR%VC\Auxiliary\Build\vcvarsall.bat" amd64

@exit /B 0

@REM -----------------------------------------------------------------------
:error_no_VS150DIR
@echo ERROR: Cannot determine the location of the VS2017 installation folder.
@exit /B 1


@REM -----------------------------------------------------------------------
:GetVS150Dir
@set VS150DIR=
@call :GetVS2017DirHelper32 HKLM > nul 2>&1
@if errorlevel 1 call :GetVS150DirHelper32 HKCU > nul 2>&1
@if errorlevel 1 call :GetVS150DirHelper64  HKLM > nul 2>&1
@if errorlevel 1 call :GetVS150DirHelper64  HKCU > nul 2>&1
@exit /B 0

:GetVS150DirHelper32
@for /F "tokens=1,2*" %%i in ('reg query "%1\SOFTWARE\Microsoft\VisualStudio\SxS\VS7" /v "15.0"') DO (
    @if "%%i"=="15.0" (
        @SET VS150DIR=%%k
    )
)
@if "%VS150DIR%"=="" exit /B 1
@exit /B 0

:GetVS150DirHelper64
@for /F "tokens=1,2*" %%i in ('reg query "%1\SOFTWARE\Wow6432Node\Microsoft\VisualStudio\SxS\VS7" /v "15.0"') DO (
    @if "%%i"=="15.0" (
        @SET VS150DIR=%%k
    )
)
@if "%VS150DIR%"=="" exit /B 1
@exit /B 0


:end
```

After this step, lots of VC utilities, such as `cl.exe`, and `nmake.exe`, should be usable by now. That's why we tell CMake to generate nmake projects. You could just copy paste them.

## Releasing (Deploying)

After this ruckus it's time to use GitHub release! I mean, what's the point of building it if you are not planning to test it, and you are not downloading it too? During this step, we need the travis CLI. Or, if you are feeling hardcore, you could use the `openssl` too. Both works! I will put references down below. But I will only use travis CLI here. The simpliest way.

So first, we've gotta download it. We can install the travis CLI using rubygem:

```sh
gem install travis
```

And we're done!

After that, we `cd` to the project root directory. And then, we use the command 

```sh
travis login --pro
```

To log in. After logging in, we can do

```sh
travis setup releases --pro
```

And then it will asks for your credentials again; just input it. Then, it will ask for the file to release. That's what the 7z command was doing above, by the way. If you don't feel like it, simply remove it. After that a portion should appear on the bottom of the `.travis.yml` file, and it should look like this:

```yml
deploy:
  provider: releases
  api_key:
    secure: some really long base64 nonsense
  file: your artifact
  on:
    repo: some repo
```

It is nice, and it works now. If you tag a commit, then push to the remote, Travis will try to release now:

```sh
git add .
git commit -m "Whatever"
git tag v0.0.1
git push --tags
```

But in the release, the artifact is gone! There's only enlarged download buttons of the source code. It looks like this becuase Travis actually cleans up the build folder when trying to release! Also the release part should most likely be skipped because the repo name does not match, which I am still having difficulty to understand. Nevertheless, this means we should update the `.travis.yml` once again! And here's how the `deploy` part should look after modification:

```yml
deploy:
  provider: releases
  api_key:
    secure: some really long base64 nonsense
  file: your artifact
  skip_cleanup: true
  on:
    tags: true
```

By adding `skip_cleanup`, Travis skips the cleanup when trying to release artifacts. And by adding `tags: true` after `on:`, that means whenever you do a tagged commit, Travis will try to release it. Convenient and easy!

## Conclusion

Travis really saves time if you want to automate tests, and in my case, building a Windows executable. Or other OSes! macOS, Ubuntu, you name it. It also supports building matrices and stuffs, but I am still discovering it. Have fun using it to build inter-OS artifacts for you!

## References

1. [Travis CI official website](https://travis-ci.org/)
2. [How to C++ in Windows, Travis Community](https://travis-ci.community/t/how-to-c-in-windows/3273)
3. [Building a C++ Project, Travis Docs](https://docs.travis-ci.com/user/languages/cpp/)
4. [The Windows Build Environment, Travis Docs](https://docs.travis-ci.com/user/reference/windows/)
5. [GitHub Releases Uploading, Travis Docs](https://docs.travis-ci.com/user/deployment/releases/#authenticating-with-an-oauth-token)
6. [Deploy api_key: “GITHUB OAUTH TOKEN” ambiguity, Travis Community](https://travis-ci.community/t/deploy-api-key-github-oauth-token-ambiguity/5092) (Includes a way where no Travis CI is needed!)
7. [NMake Reference, Microsoft Docs](https://docs.microsoft.com/en-us/cpp/build/reference/nmake-reference?view=vs-2019)
8. [Use the Microsoft C++ toolset from the command line, Microsoft Docs](https://docs.microsoft.com/en-us/cpp/build/building-on-the-command-line?view=vs-2019) (In fact, you can also use `devenv.exe` or `msbuild.exe` to build, as long as you can find where it is)

